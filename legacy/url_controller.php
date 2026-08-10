<?php
$url = explode("/", $_SERVER['QUERY_STRING']);
if(file_exists("pages/".$url[0].".php")){
    require_once("pages/".$url[0].".php");
}
elseif($url[0] == "" || $url[0] == "home" || $url[0] == "index"){
    require_once("pages/index.php");
}
else{
    require_once("pages/error.php");
}
?>
