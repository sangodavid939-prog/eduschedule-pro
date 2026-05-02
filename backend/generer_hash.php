<?php
$motDePasse = "Admin1234!";
$hash = password_hash($motDePasse, PASSWORD_DEFAULT);
echo $hash;
?>