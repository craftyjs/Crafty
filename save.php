<?php

require_once('database.php');
mysql_connect($server, $user, $pass);
mysql_use_database($database);

header("Content-Type: text/javascript");

$_DATA = $_GET + $_POST;
foreach ($_DATA as &$v) {
	$v = mysql_real_escape_string($v);
}
$s = "CREATE TABLE IF NOT EXISTS %s (key VARCHAR(255) PRIMARY KEY, ts TIMESTAMP, data TEXT)";
mysql_query(sprint($s, $_DATA['game']));

$output = array();
switch ($_DATA['mode']) {
case 'timestamps':
	$s = "SELECT key, ts FROM %s";
	$q = mysql_query(sprintf($s, $_DATA['game']));
	while ($r = mysql_fetch_assoc($q)) {
		$output[$r['key']] = $r['ts'];
	}
break;
case 'save':
	$s = "SELECT ts FROM %s WHERE key = '%s'";
	$q = mysql_query(sprintf($s, $_DATA['game'], $_DATA['key']));
	if (mysql_num_rows($q)) {
		$s = "UPDATE %s SET data = '%s', ts = %d WHERE key = '%s'";
		$q = mysql_query(sprintf($s, $_DATA['game'], $_DATA['data'], $_DATA['ts'], $_DATA['key']));
	}
	else {
		$s = "INSERT INTO %s VALUES ('%s', %d, '%s')";
		$q = mysql_query(sprintf($s, $_DATA['game'], $_DATA['key'], $_DATA['ts'], $_DATA['data']));
	}
break;
case 'load':
	$s = "SELECT * FROM %s WHERE key = '%s'";
	$q = mysql_query(sprintf($s, $_DATA['game'], $_DATA['key']));
	$output = mysql_fetch_assoc($q);
break;
}

if (!empty($output)
	print json_encode($output, JSON_FORCE_OBJECT);
?>