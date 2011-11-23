<?php
$db = mysql_real_escape_string($_POST['game']);
include('db.main.inc');

$table = 'save';
$fields = array(
	'key' => array(
		'type' => 'string',
		'length' => 255,
		'index' => 'primary key',
	),
	'player' => array(
		'type' => 'int',
		'length' => 11,
	),
	'ts' => array(
		'type' => 'timestamp',
	),
	'data' => array(
		'type' => 'text',
	),
);

createTable($table, $fields);

$output = array();
switch ($_POST['mode']) {
	case 'timestamps':
		$s = s("SELECT key, ts AS timestamp FROM %s", $table);
		$q = q($s);
		while ($r = f($q)) {
			$output[] = (object)$r;
		}
	break;
	case 'save':
		$r = f(q(s("SELECT COUNT(key) AS c FROM %s WHERE key = '%s'", $table, $_POST['key'])));
		if ($r['c']) {
			// update
			q(s("UPDATE %s SET data = '%s', ts = %d WHERE key = '%s'", $table, serialize($_POST['data']), $_POST['timestamp']));
		}
		else {
			// insert
			q(s("INSERT INTO %s VALUE('%s', 0, %d, '%s')", $table, $_POST['key'], $_POST['timestamp'], serialize($_POST['data'])));
		}
	break;
	case 'load':
	break;
}

echo json_encode($output);
?>