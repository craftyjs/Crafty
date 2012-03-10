<?php
include 'markdown.php';

//tag constants
define("SIGN", "sign");
define("EXAMPLE", "example");
define("END", "end");
define("PARAM", "param");
define("SEE", "see");
define("RETURNS", "return");
define("COMP", "comp");
define("CATEGORY", "category");
define("TRIGGER", "trigger");

function docs($files, $path, $save) {
	$category = array(); //array of categories
	$comps = array(); //array of components
	$names = array(); //array of named elements
	$events = array(); //array of events
	
	//loop over files
	foreach($files as $file) {
		$fh = fopen($path.$file, 'r');
		$open = false;
		$lastTag = "";
		$block = "";
		
		while($line = fgets($fh)) {
			if(strstr($line, "/**@") !== false && !$open) {
				$block = "";
				$open = true;
			}
			
			if($open) {
				$cleanline = stripslashes(preg_replace("!(/\*+@?|^\s*\*/?\s?)!","", $line));
				$def = substr($cleanline, 0, 1);
				
				if($def == "#") { //name
					$name = trim(substr($cleanline, 1));
					$block .= $cleanline;
				} else if($def == "@") { //tag
					preg_match("/\@([^\s]*)\s(.*)/", $cleanline, $matches);
					$tag = $matches[1];
					$value = $matches[2];
					
					switch($tag) {
						case SIGN:
							$block .= "`".$value."`\n\n";
							break;
						case EXAMPLE:
							$block .= "###Example\n";
							break;
						case END:
							$block .= "\n";
							break;
						case PARAM:
							$split = preg_split("/\s+-\s+/", $value);
							$block .= "{$split[0]}\n:\t{$split[1]}\n\n";
							break;
						case RETURNS:
							$block .= "###Returns\n".$value."\n\n";
							break;
						case SEE:
							$split = preg_split("/\s*,\s*/", $value);
							$block .= "###See Also\n";
							foreach($split as $see) {
								if(substr($see, 0, 1) === '.') {
									$link = "#".cleanFile($see);
								} else if(strstr($see, '#') != false) {
									$parts = explode('#', $see);
									$link = cleanFile($parts[0]).".html#".cleanFile($parts[1]);
								} else {
									$link = cleanFile($see).".html";
								}
								$block .= "- [".$see."](".$link.")\n";
							}
							break;
						case CATEGORY:
							$split = preg_split("/\s*,\s*/", $value);
							foreach($split as $v) {
								$v = trim($v);
								if(!isset($category[$v])) $category[$v] = array();
								$category[$v][] = $name;
							}
							break;
						case COMP:
							$split = preg_split("/\s*,\s*/", $value);
							foreach($split as $v) {
								$v = trim($v);
								if(!isset($comps[$v])) $comps[$v] = array();
								$comps[$v][] = $name;
							}
							break;
						case TRIGGER:
							if($lastTag != TRIGGER) {
								$block .= "###Events\n";
							}
							$split = preg_split("/\s+-\s+/", $value);
							$block .= "{$split[0]}";
							if(count($split) >= 3) {
								$split[2] = trim($split[2]);
								if(count($split) >= 4) {
									$split[3] = trim($split[3]);
									$block .= " [{$split[3]}: {$split[2]}]";
								}else{
									$block .= " [Data: {$split[2]}]";
								}
							}
							$block .= "\n:\t{$split[1]}\n\n";
							break;
					}
					$lastTag = $tag;
					
				} else if(trim($cleanline) == "") {
					$block .= "\n";
				} else {
					$block .= $cleanline;
				}
			}
			
			if(strstr($line, "*/") !== false && $open) {
				$open = false; 
				
				$names[$name] = $block;
			}
		}
		
		fclose($fh);
	}
	$head = stripslashes(file_get_contents("header.php"));
	$foot = stripslashes(file_get_contents("footer.php"));
		
	//generate the index
	$index = "<div id='doc-nav'><ul id='doc-level-one'>";
	$found = array();
	foreach($category as $cat=>$subs) {
		$index .= "<li>".$cat."<ul>";
		foreach($subs as $sub) {
			$link = cleanFile($sub).".html";
			$index .= "<li><a href='{$link}'>".$sub."</a></li>";
			
			$found[$sub] = $link;
		}
		$index .= "</ul></li>";
	}
	$index .= "</ul></div>";
	file_put_contents($save."index.html", $head.$index.$foot);
	
	foreach($found as $sub=>$link) {
		$content = $index."<div id='doc-content'>";
		
		if(isset($comps[$sub])) {
			$content .= Markdown($names[$sub]);
			
			//loop over each part of the component
			$parts = $comps[$sub];
			
			//add the contents
			$content .= "<div class='doc-contents'><ul>";
			foreach($parts as $part) {
				$content .= "<li><a href='#".cleanFile($part)."'>{$part}</a></li>";
			}
			$content .= "</ul></div>";
			
			//add the content
			foreach($parts as $part) {
				$content .= "<div class='doc-block' id='".cleanFile($part)."'><a href='#doc-nav' class='doc-top'>Back to top</a>";
				$html = Markdown($names[$part]);
				$html = preg_replace("!<(/)?h2>!","<$1h3>", $html);
				$html = preg_replace("!<(/)?h1>!","<$1h2>", $html);
				
				$content .= $html;
				$content .= "</div>";
			}
		} else {
			$content .= Markdown($names[$sub]);
		}
		$content .= "</div>";
		
		
		file_put_contents($save.$link, $head.$content.$foot);
	}
	
}

function cleanFile($file) {
	$res = preg_replace("/[\.\(\)\s]/","-",$file);
	if($res[strlen($res)-1] == "-") {
		$res = substr($res,0,-1);
	}
	return $res;
}

function merge($files, $path = "", $save) {
	$src = "";
	
	foreach($files as $file) {
		$src .= file_get_contents($path.$file);
		$src .= "\n\r\n\r";
	}

	file_put_contents($save."crafty.js", $src);
}

$files = array("license.txt", 
			   "core.js",
			   "intro.js", 
			   "HashMap.js", 
			   "2D.js", 
			   "collision.js", 
			   "DOM.js",
			   "html.js",
			   "storage.js",
			   "extensions.js",
			   "sprite.js",
			   "canvas.js",
			   "controls.js", 
			   "animate.js", 
			   "animation.js",
			   "drawing.js", 
			   "isometric.js", 
			   "sound.js", 
			   "text.js", 
			   "loader.js", 
			   "math.js",
			   "time.js",
			   "outro.js");

if(!is_dir('api/')) {
  mkdir('api');
}

docs($files, "../src/", "api/");
merge($files, "../src/",  "../");
?>
<h1>Merged and Built Successfully</h1>
