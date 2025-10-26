<?php
session_start();
$_SESSION['admin_token'] = 'liueggy_admin_2024';
echo json_encode([
    'success' => true,
    'message' => 'Session token 已设置',
    'session_id' => session_id()
]);
?>