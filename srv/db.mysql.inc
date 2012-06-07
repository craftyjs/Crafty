<?php
/**
 * db.auth.php contains server specific parameters
 * It should never be made public
 */
$conn = mysql_connect($server, $user, $pass);
if (!mysql_select_db($db)) {
	mysql_create_db($db);
}

/**
 * # createTable
 * @comp Database
 * @sign createTable(String name, Array fields)
 * @param 	name	The name of the table
 * @param	fields	array of field data, with field name as keys
 * 
 * Creates a table if one doesn't exist, using the array given in fields to create columns
 * Ex:
 * $fields = array(
	'id' => array(
		'type' => 'int',
		'length' => 11,
		'index' => 'primary key',
		'autoincrement' => false,
	),
	'data' => array(
		'type' => 'string',
		'length' => 256,
		'index' => 'no'
	),
 );
 createTable('save', $fields);
 */
function createTable($name, $fields) {
	$s = s("SELECT * FROM %s LIMIT 1", $name);
	if (!($res = q($s))) {
		// table doesn't exist yet
		$s = "CREATE TABLE %s (%s)";
		$columns = array();
		foreach ($fields as $f_name => $f) {
			$str = $f_name.' '.getType($f['type']);
			if ($f['length']) $str.='('.$f['length'].')';
			if ($f['autoincrement']) $str.= ' AUTOINCREMENT';
			if ($f['index'] && $f['index'] != 'no') $str.= ' '.$f['index'];
			$columns[] = $str;
		}
		
		$s = s($s, $name, implode(', ', $columns));
		q($s);
	}
}

// shortcut for sprintf
function s() {
	$args = func_get_args();
	$format = array_shift($args);
	foreach ($args as &$arg) {
		if (is_string($arg))
			$arg = mysql_real_escape_string($arg);
	}
	return vsprintf($format, $args);
}

/**@
 * # q
 * @comp Database
 * @sign q(query)
 * @param	query	SQL query to made to the server
 * @return	SQL result
 */
function q($query) {
	$res = mysql_query($q); 
	if ($res) return $res;
	die(mysql_error());
}

/**@
 * # f
 * @comp Database
 * @sign f(result)
 * @param	result 	SQL result returned from q()
 */
function f($result) {
	return mysql_fetch_assoc($result);
}

function getType($type) {
	static $typeMap = array(
		'int' => 'INT',
		'string' => 'VARCHAR',
		'text' => 'TEXT',
		'float' => 'FLOAT',
	);
	
	return $typeMap[$type];
}

?>