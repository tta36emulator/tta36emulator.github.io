var CodeEditor = function (id,w,h) {
	var self = this;
	var editStrings  = [];
	var LIMIT = 80;
	var Tags = {
		writeTag: "<editable>"
	}

	var currentLineNum = 0;
	var lines = 0;
	var lineArray = [];

	var dangerWords = [
        'eval', '.call', 'call(', 'apply', 'bind',
        'prototype',
        'setTimeout', 'setInterval',
        'requestAnimationFrame', 'mozRequestAnimationFrame',
        'webkitRequestAnimationFrame', 'setImmediate',
        'prompt', 'confirm',
        'debugger',
        'delete',
        'atob(','btoa(',
        'Function(',
        'constructor',
        'window',
        'document',
        'self.', 'self[', 'top.', 'top[', 'frames',
        'parent', 'content',
        'validate', 'onExit', 'objective',
        'this['
    ];

    var warnings = [];

	var editor = CodeMirror.fromTextArea(document.getElementById(id), {
					lineNumbers: true,
					matchBrackets: true,
					mode: 'javascript',
					theme: "vibrant-ink",
					indentUnit: 4,
					lineWrapping:false,
					dragDrop: false,
					smartIndent: false,
					disableSpellcheck: false
				});   
				editor.setSize(w, h); 



		self.preprocess = function(code){
			 //var lines = code.split("\n");
			 //var resultCode = "";
			 /*var resultCode = "";
			 editStrings.length = 0;
			 warnings.length = 0;

			 for(var i = 0; i < lines.length; i++){ 
				if(lines[i].indexOf(Tags.writeTag) > -1){
					lines[i] = lines[i].replace("<editable>","");
					   editStrings.push(i);
				}

				if (i != lines.length - 1)
					resultCode += lines[i] + "\n";
			 }

			return resultCode;*/

			/*for(var i = 0; i < lines.length; i++){ 
				var commentBegin = lines[i].indexOf('//');	
				if(commentBegin > -1) 
					lines[i] = lines[i].substring(0, commentBegin).trim();

				if(i !=  lines.length - 1)
					resultCode += lines[i] + '\n';
				else
					resultCode += lines[i];
			}*/

			return code;
		};

		var isReadOnly = function(num){
			if(editStrings.indexOf(num) === -1) return true;
			return false;
		};

		var shiftElements = function(arr,bound,n){
	       return arr.map(function(num) {
		        if (num > bound) {return num + n;} return num;
	        });
   		};

   		var getEndWritableBlock = function(begin){
   			var a = begin;
			while(editStrings.indexOf(a) !== -1)
				a++;
			return a;
   		};

   		var removeElement = function(arr, elem) {
   			for(var i = arr.length; i--;) {
		        if(arr[i] === elem) {
		            arr.splice(i, 1);
		        }
		    }
   		};

   		var inEditableArea = function(c) {
            var lineNum = c.to.line;
            if (editStrings.indexOf(lineNum) !== -1 && editStrings.indexOf(c.from.line) !== -1)          	
                return true;
            
			return false;
        };

		var process = function(me, change){
			if(!inEditableArea(change)){
				change.cancel();
				return;
			}

			var newLines = change.text.length - (change.to.line - change.from.line + 1);
			var currentLine = change.to.line;

			if(isReadOnly(currentLine)){
	        	change.cancel();
	        	return;
	        }

				//cut off 80 chars
	        var textlen = me.getLine(currentLine).length;
	        if (textlen + change.text[0].length > LIMIT) {
	             var allowedLength = Math.max(LIMIT - textlen, 0);
	                change.text[0] = change.text[0].substr(0, allowedLength);
	        }

			if(newLines > 0){
				//onNewLines
					var bound = getEndWritableBlock(currentLine);
					editStrings = shiftElements(editStrings, bound, newLines);
					for (var i = bound; i < bound + newLines; i++) {
	            			editStrings.push(i);
	        		}

	        		editStrings.sort();
			}
			else if(change.to.line < change.from.line || change.to.line - change.from.line + 1 > change.text.length){
				//onDeleteLines
					var count = change.to.line - change.from.line - change.text.length + 1;
					var bound = getEndWritableBlock(currentLine);

					var begin = bound - 1;
					var end   = bound - (count + 1);

					if(isReadOnly(begin-1))
					{
						change.cancel();
	        			return;
					}

					for (var i = begin; i > end; i--) {
            			    removeElement(editStrings,i);
       				}

       				editStrings = shiftElements(editStrings, bound, -count);
					editStrings.sort();
			}
		};

		self.loadCode = function(code){	
			//editor.off('beforeChange', process);
				var ccode = self.preprocess(code);
				editor.setValue(ccode);
				editor.addLineClass(currentLineNum, "wrap", "currentLine"); 
				lineArray = ccode.split("\n");
				lines = lineArray.length;
			//editor.on('beforeChange', process);
		};

		self.appendTo = function(text) {
		    editor.replaceRange(text, CodeMirror.Pos(currentLineNum-1));
		}

		self.insertLine = function(text) {
		    var doc = editor.getDoc();
			var cursor = doc.getCursor();
			var line = doc.getLine(cursor.line);
			var pos = { 
			    line: self.getLinesCount,
			    ch: line.length - 1
			}
			doc.replaceRange(text + '\n', pos);
		}

		self.getLinesCount = function(){return lines};

		self.step = function(updateLine){
			var s = lineArray[currentLineNum];

			if(updateLine){
				editor.removeLineClass(currentLineNum, "wrap", "currentLine");
				editor.addLineClass(currentLineNum, "wrap", "simpleLine");
			}
			
			currentLineNum++;

			if(updateLine){
				if(currentLineNum < lines){
					editor.removeLineClass(currentLineNum, "wrap", "simpleLine");
					editor.removeLineClass(currentLineNum, "wrap", "errorLine");	
					editor.addLineClass(currentLineNum, "wrap", "currentLine");	
				}	
			}	
			return s;
		};

		self.selectBreakPointLine = function(line){
			editor.removeLineClass(line, "wrap", "simpleLine");
			editor.removeLineClass(line, "wrap", "currentLine");
			editor.addLineClass(line, "wrap", "breakPointLine");		
		}

		self.selectErrorLine = function(){
			var line = currentLineNum - 1;
			editor.removeLineClass(line, "wrap", "simpleLine");
			editor.addLineClass(line, "wrap", "errorLine");		
		}

		self.selectLine = function(value){
			editor.removeLineClass(value, "wrap", "simpleLine");
			editor.removeLineClass(value, "wrap", "errorLine");	
			editor.addLineClass(value, "wrap", "currentLine");
		}

		self.reset = function(){		
			editor.removeLineClass(currentLineNum, "wrap", "currentLine");
			editor.removeLineClass(currentLineNum, "wrap", "errorLine");	
			editor.addLineClass(currentLineNum, "wrap", "simpleLine");
			  currentLineNum=0;
			editor.removeLineClass(currentLineNum, "wrap", "simpleLine");
			editor.removeLineClass(currentLineNum, "wrap", "errorLine");	
			editor.addLineClass(currentLineNum, "wrap", "currentLine");

			self.loadCode(self.getCode());	
		};

		self.getCurrentLineNum = function(){
			return currentLineNum;
		};

		self.getCursorLine = function(){
			var doc = editor.getDoc();
			var cursor = doc.getCursor();
			return cursor.line;
		};

		self.loadState = function(code,css){	
			editor.off('beforeChange', process);
				var ccode = self.preprocess(code);

				css = css.split(',');
				for(var i = 0; i < css.length; i++)
					editStrings.push(parseInt(css[i]));

				editor.setValue(ccode);
				var lineArray = ccode.split("\n");
				for(var i = 0; i < lineArray.length; i++){
					if(isReadOnly(i)){
						editor.addLineClass(i, "wrap", "readOnly"); 
					}
				};
			editor.on('beforeChange', process);
		};

		self.setValue = function(value){
			editor.setValue(value);
			editor.refresh();
		};

		self.getStrings = function(){
			return editStrings;
		};

		self.getCode = function(){
			return editor.getValue();
		};

		self.refresh = function(){
			return editor.refresh();
		};
		self.focus = function(){
			editor.focus();
		};
		editor.on("focus", function(instance) {
			/*game.currentfocus = "editor";
			var editorPane = document.getElementById('codePane');
			editorPane.style.border = '2px solid #ffaaaa';*/
        });
		editor.on("blur", function(instance) {
			var editorPane = document.getElementById('codePane');
			editorPane.style.border = '2px solid #ccc';
        });
}