<?php
/**
 * db.auth.php contains server specific parameters
 * It should never be made public
 */
include('db.auth.php');
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
		'index' => 'primary',
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

?>