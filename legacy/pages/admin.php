<?php
// 1. Include Database Connection
include 'include/db_connect.php';

// 2. Initialize Variables
$id = 0;
$title = "";
$description = "";
$image_url = "";
$page_link = "";
$icon_class = "";
$cta_text = "";
$update = false;

// --- A. HANDLE DELETE ---
if (isset($_GET['delete'])) {
    $id = intval($_GET['delete']);
    
    // Get file info before deleting to remove image/page if needed
    $query = $conn->query("SELECT * FROM travel_categories WHERE id=$id");
    if($query->num_rows > 0){
        $row = $query->fetch_assoc();
        
        // Optional: Delete generated page file
        $generated_page = "../pages/" . preg_replace('/[^a-z0-9-_]/', '', strtolower($row['page_link'])) . ".php";
        if (file_exists($generated_page)) { unlink($generated_page); }
        
        // Execute Delete
        $conn->query("DELETE FROM travel_categories WHERE id=$id");
    }
    header("location: admin.php");
    exit();
}

// --- B. HANDLE EDIT (Load Data) ---
if (isset($_GET['edit'])) {
    $id = intval($_GET['edit']);
    $update = true;
    $result = $conn->query("SELECT * FROM travel_categories WHERE id=$id");
    if ($result->num_rows > 0) {
        $row = $result->fetch_array();
        $title = $row['title'];
        $description = $row['description'];
        $image_url = $row['image_url'];
        $page_link = $row['page_link'];
        $icon_class = $row['icon_class'];
        $cta_text = $row['cta_text'];
    }
}

// --- C. HANDLE SAVE (Insert or Update) ---
if (isset($_POST['save'])) {
    $title = mysqli_real_escape_string($conn, $_POST['title']);
    $description = mysqli_real_escape_string($conn, $_POST['description']);
    $page_link = mysqli_real_escape_string($conn, $_POST['page_link']); 
    $icon_class = mysqli_real_escape_string($conn, $_POST['icon_class']);
    $cta_text = mysqli_real_escape_string($conn, $_POST['cta_text']);
    $current_id = $_POST['id'];

    // Image Upload Logic
    $target_dir = "uploads/";
    if (!file_exists($target_dir)) { mkdir($target_dir, 0777, true); }

    $final_image = $_POST['current_image']; // Default to existing

    if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] == 0) {
        $file_name = time() . "_" . basename($_FILES["image_file"]["name"]);
        $target_file = $target_dir . $file_name;
        if (move_uploaded_file($_FILES["image_file"]["tmp_name"], $target_file)) {
            $final_image = $target_dir . $file_name; // Update if new upload success
        }
    }

    // Insert or Update Query
    if ($current_id != 0) {
        // UPDATE
        $sql = "UPDATE travel_categories SET title='$title', description='$description', image_url='$final_image', page_link='$page_link', icon_class='$icon_class', cta_text='$cta_text' WHERE id=$current_id";
    } else {
        // INSERT
        $sql = "INSERT INTO travel_categories (title, description, image_url, page_link, icon_class, cta_text) VALUES ('$title', '$description', '$final_image', '$page_link', '$icon_class', '$cta_text')";
    }
    
    // Execute DB Query
    $conn->query($sql);

    // --- D. GENERATE PAGE FILE ---
    $pages_dir = "../pages/";
    if (!file_exists($pages_dir)) { mkdir($pages_dir, 0777, true); }
    $clean_name = preg_replace('/[^a-z0-9-_]/', '', strtolower($page_link));
    $new_file_path = $pages_dir . $clean_name . ".php"; 

    // Content for the new page
    $page_content = '<?php include "../admin/db_connect.php"; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . $title . ' - Visit Rwanda</title>
    <link rel="stylesheet" href="../assets/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <?php include "../include/nav.php"; ?>

    <header class="landing-hero" style="background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(\'../admin/' . $final_image . '\'); background-size: cover; background-position: center; height: 60vh; display: flex; align-items: center; justify-content: center; text-align: center; color: white;">
        <div class="hero-content">
            <h1 style="font-size: 3.5rem; font-weight: 800;">' . $title . '</h1>
            <p style="font-size: 1.2rem; max-width: 600px; margin: 0 auto;">' . $description . '</p>
        </div>
    </header>

    <div class="container" style="padding: 80px 20px; text-align: center;">
        <h2>Explore ' . $title . '</h2>
        <p>This is a dynamically generated page based on your category.</p>
        <a href="../index.php" class="btn-primary-lg" style="background:#00A859; color:white; padding:15px 30px; text-decoration:none; border-radius:30px;">Go Back Home</a>
    </div>

    <?php include "../include/footer.php"; ?>
</body>
</html>';

    file_put_contents($new_file_path, $page_content);

    // Refresh page
    header("location: admin.php"); 
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { background: #f8f9fa; }
        .sidebar { min-height: 100vh; background: #343a40; color: white; padding: 20px; }
        .sidebar a { color: #cfd8dc; text-decoration: none; display: block; padding: 10px; }
        .sidebar a:hover { color: white; background: #495057; border-radius: 5px; }
        .content { padding: 30px; }
        .card-custom { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="d-flex">
        <div class="sidebar col-md-2">
            <h3>VisitRwanda</h3>
            <hr>
            <a href="admin.php"><i class="fas fa-list"></i> Categories</a>
            <a href="../index.php" target="_blank"><i class="fas fa-eye"></i> View Website</a>
        </div>

        <div class="content col-md-10">
            <h2 class="mb-4">Manage Travel Categories</h2>

            <div class="card-custom mb-5">
                <h4><?php echo $update ? 'Edit Category' : 'Add New Category'; ?></h4>
                <form action="admin.php" method="POST" enctype="multipart/form-data">
                    <input type="hidden" name="id" value="<?php echo $id; ?>">
                    <input type="hidden" name="current_image" value="<?php echo $image_url; ?>">

                    <div class="row mt-3">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Title</label>
                            <input type="text" name="title" class="form-control" value="<?php echo $title; ?>" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Icon (FontAwesome)</label>
                            <input type="text" name="icon_class" class="form-control" value="<?php echo $icon_class; ?>" placeholder="fas fa-landmark" required>
                        </div>
                        <div class="col-12 mb-3">
                            <label class="form-label">Description</label>
                            <textarea name="description" class="form-control" required><?php echo $description; ?></textarea>
                        </div>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Page Link Name (e.g. historics)</label>
                            <input type="text" name="page_link" class="form-control" value="<?php echo $page_link; ?>" required>
                        </div>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Button Text</label>
                            <input type="text" name="cta_text" class="form-control" value="<?php echo $cta_text; ?>" required>
                        </div>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Image</label>
                            <input type="file" name="image_file" class="form-control">
                            <?php if($image_url): ?><small>Current: <?php echo basename($image_url); ?></small><?php endif; ?>
                        </div>
                    </div>
                    <button type="submit" name="save" class="btn btn-success"><?php echo $update ? 'Update Category' : 'Save Category'; ?></button>
                    <?php if($update): ?><a href="admin.php" class="btn btn-secondary">Cancel</a><?php endif; ?>
                </form>
            </div>

            <div class="card-custom">
                <h4>Current Categories</h4>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php 
                        $res = $conn->query("SELECT * FROM travel_categories");
                        while($row = $res->fetch_assoc()): 
                            // Fix image path for display
                            $displayImg = (strpos($row['image_url'], 'http') === 0) ? $row['image_url'] : $row['image_url'];
                        ?>
                        <tr>
                            <td><img src="<?php echo $displayImg; ?>" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;"></td>
                            <td><?php echo $row['title']; ?></td>
                            <td><?php echo substr($row['description'], 0, 50); ?>...</td>
                            <td>
                                <a href="admin.php?edit=<?php echo $row['id']; ?>" class="btn btn-sm btn-primary">Edit</a>
                                <a href="admin.php?delete=<?php echo $row['id']; ?>" class="btn btn-sm btn-danger" onclick="return confirm('Delete?');">Delete</a>
                            </td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>