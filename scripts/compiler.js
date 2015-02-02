//#############################-INPUT-#############################################
	(function() {
		var pressedKeys = {}, mouse = {LBUTTON: false, RBUTTON: false, MBUTTON: false};
		document.oncontextmenu = function (){return false};

		function setKey(event, status) {
			var code = event.keyCode, key;
			switch(code) {
				case 53:
					if(event.ctrlKey)
					{				
						key = '5'; 
						
						break;
					}
				case 54:
					if(event.ctrlKey){
						key = '6'; 

						break;	
					}
				case 82:
					if(event.ctrlKey){

						break;
					}
				case 69:
					if(event.ctrlKey){
						key = 'E'; 
		
						break;
					}
				default:
					key = String.fromCharCode(code);
					//alert(code);
			}


			pressedKeys[key] = status;
		}

		document.addEventListener('keydown', function(e) {
			setKey(e, true);
		});

		document.addEventListener('keyup', function(e) {
			setKey(e, false);
		});

		document.addEventListener('mousedown', function(e) {
			if(e.which === 1)
				mouse["LBUTTON"] = true;
			else if(e.which === 2)
				mouse["MBUTTON"] = true;
			else if(e.which === 3)
				mouse["RBUTTON"] = true;
		});

		document.addEventListener('mouseup', function(e) {
				mouse["LBUTTON"] = false;
				mouse["RBUTTON"] = false;
				mouse["MBUTTON"] = false;
		});

		window.addEventListener('blur', function() {
			pressedKeys = {};
		    mouse = {LBUTTON: false, RBUTTON: false, MBUTTON: false};
		});

		window.input = {
			isDown: function(key) {
				return pressedKeys[key.toUpperCase()];
			},
			isClick:function(button){
				return mouse[button];
			}
		};
	});
//#############################-INPUT-#############################################


var Compiler = function(){

	//#############################-Xcanvas-###########################################
		var Xcanvas = function(ctx,cvs){
			var _xcanvas = this;
			var part = null;
			var context = ctx;
			var canvas = cvs;

			_xcanvas.drawText = function(font, text, x, y, color){
				context.font       = font;
				context.fillStyle  = color;
				context.fillText(text, x, y);
			};

			_xcanvas.drawError = function(font, text, x, y, color){
				_xcanvas.clearCanvas('#fcc');
				context.font       = font;
				context.fillStyle  = color;
				context.fillText(text, x, y);
				codeDump.value += text + "\n";
			};
		
			_xcanvas.clearColor = function(color){
				context.fillStyle = color;
				context.clearRect(0, 0, canvas.width, canvas.height);
				context.fillRect(0, 0, canvas.width, canvas.height);
			};

			_xcanvas.clearCanvas = function(color,data){
				context.fillStyle = color;

				if(data !== undefined && data !== null)
					context.putImageData(data,0,0);
				else{
					context.clearRect(0, 0, canvas.width, canvas.height);
					context.fillRect(0, 0, canvas.width, canvas.height);
				}
			};

			_xcanvas.clear = function(){
				context.clearRect(0, 0, canvas.width, canvas.height);
			}

			_xcanvas.clearRect = function(rect){
				context.clearRect(rect.x, rect.y, rect.w, rect.h);
			}

			_xcanvas.drawRect = function(rect,color,width){
				context.beginPath();
				context.rect(rect.x, rect.y, rect.w, rect.h);
				context.lineWidth   = width;
				context.strokeStyle = color;
				context.stroke();
			};

			_xcanvas.fillRect = function(rect,color){
				context.beginPath();
				context.rect(rect.x, rect.y, rect.w, rect.h);
				context.fillStyle   = color;
				context.fill();
				context.lineWidth   = 1;
				context.strokeStyle = '#000';
				context.stroke();
			};

			_xcanvas.drawPoint = function(x, y, size, color){
				ctx.fillStyle = color;
				ctx.beginPath();
				ctx.arc(x, y, size, 0, 2*Math.PI, true);
				ctx.fill();
				ctx.closePath();
			};

			_xcanvas.imageSmoothingEnabled = function (state) {
				context.mozImageSmoothingEnabled 	= state;
				context.oImageSmoothingEnabled 		= state;
				context.webkitImageSmoothingEnabled = state;
				context.imageSmoothingEnabled 		= state;
			};
		}
	//#############################-ENDXcanvas-########################################

	_compiler = this;
	var codeEditor  = new CodeEditor();

	var screen  = document.getElementById('lay1');
	var bg_context = screen.getContext('2d');

	var errorScreen   = document.getElementById('lay3');
	var errorContext = errorScreen.getContext('2d');

	var xcanvas = new Xcanvas(bg_context, screen);
	var errorCanvas = new Xcanvas(errorContext, screen);

	var dstTable  = document.getElementById('dstTable');
	var srcTable  = document.getElementById('srcTable');
	var flgTable  = document.getElementById('flgTable');
	var lblTable  = document.getElementById('lblTable');
	var binBundle = document.getElementById('binaryBundle');
	var hexBundle = document.getElementById('hexBundle');
	var codeDump  = document.getElementById('codeDump');

	var SlotsTable = {
		values:{
			slot0src: document.getElementById('slot0SRCVal'),
			slot0dst: document.getElementById('slot0DSTVal'),
			slot1src: document.getElementById('slot1SRCVal'),
			slot1dst: document.getElementById('slot1DSTVal'),
			slot2src: document.getElementById('slot2SRCVal'),
			slot2dst: document.getElementById('slot2DSTVal'),
			slot1cdtn: document.getElementById('slot1CDTNVal'),
			slot2cdtn: document.getElementById('slot2CDTNVal'),
		},

		exp:{
			slot0src: document.getElementById('slot0SRCExp'),
			slot0dst: document.getElementById('slot0DSTExp'),
			slot1src: document.getElementById('slot1SRCExp'),
			slot1dst: document.getElementById('slot1DSTExp'),
			slot2src: document.getElementById('slot2SRCExp'),
			slot2dst: document.getElementById('slot2DSTExp'),
			slot1cdtn: document.getElementById('slot1CDTNExp'),
			slot2cdtn: document.getElementById('slot2CDTNExp'),
		}
	}
	
	var currentCommand = document.getElementById('currentCommand');

	var temp = {
		slot0:{src:0,dst:0},
		slot1:{src:0,dst:0},
		slot2:{src:0,dst:0},
	};

	xcanvas.clearCanvas('#ccf');
	xcanvas.drawText('Console 12pt', 'SCREEN', 5, 10, '#000');
	errorCanvas.clearCanvas('#cfc');

	codeEditor.refresh();

		//fill hex nubmer zero
	var zeroFill  = function(number, width )
	{
		width -= number.toString().length;
		if ( width > 0 ) return new Array(width + (/\./.test(number) ? 2 : 1) ).join( '0' ) + number;
		return number;
	};

	var toDec = function(hexNumber) {return parseInt(hexNumber,16);};

	var toBin = function(decValue){
		if(decValue >= 0) return decValue.toString(2);
		else return (~decValue).toString(2);
	}

	var toHex = function(number) {
		number = number.toString(16).toUpperCase();
	    return "0x" + zeroFill(number, 4);
	};

	var toHex2 = function binaryToHex(s) {
    	var i, k, part, accum, ret = '';
	    for (i = s.length-1; i >= 3; i -= 4) {
	        // extract out in substrings of 4 and convert to hex
	        part = s.substr(i+1-4, 4);
	        accum = 0;
	        for (k = 0; k < 4; k += 1) {
	            if (part[k] !== '0' && part[k] !== '1') {
	                // invalid character
	                return { valid: false };
	            }
	            // compute the length 4 substring
	            accum = accum * 2 + parseInt(part[k], 10);
	        }
	        if (accum >= 10) {
	            // 'A' to 'F'
	            ret = String.fromCharCode(accum - 10 + 'A'.charCodeAt(0)) + ret;
	        } else {
	            // '0' to '9'
	            ret = String(accum) + ret;
	        }
	    }
	    // remaining characters, i = 0, 1, or 2
	    if (i >= 0) {
	        accum = 0;
	        // convert from front
	        for (k = 0; k <= i; k += 1) {
	            if (s[k] !== '0' && s[k] !== '1') {
	                return { valid: false };
	            }
	            accum = accum * 2 + parseInt(s[k], 10);
	        }
	        // 3 bits, value cannot exceed 2^3 - 1 = 7, just convert
	        ret = String(accum) + ret;
	    }
	    return { valid: true, result: ret };
	};

	var destroyChildren = function(node){
		while (node.firstChild)
			node.removeChild(node.firstChild);
	};

	var clearClassChildren = function(node){
		for(var i = 0; i < node.childNodes.length; i++)
			node.childNodes[i].className = "";
	};

	var createHeaders = function(){
		var row = document.createElement('tr');

		var reg = document.createElement('td');
			reg.className = 'regCol';
			reg.innerHTML = 'REG';

		var val = document.createElement('td');
			val.className = 'regCol';
			val.innerHTML = 'Value';

		var addr = document.createElement('td');
			addr.innerHTML = 'Address';
			addr.className = 'regCol';

		row.appendChild(addr);
		row.appendChild(reg);
		row.appendChild(val);
		dstTable.appendChild(row);

			row = document.createElement('tr');
			val = document.createElement('td');
			val.innerHTML = "Value";
			val.className = 'regCol';
			flg = document.createElement('td');
			flg.innerHTML = "Flag";	
			flg.className = 'regCol';			
			row.appendChild(flg);
			row.appendChild(val);
		flgTable.appendChild(row);

			row = document.createElement('tr');
			val = document.createElement('td');
			flg = document.createElement('td');
			flg.innerHTML = "Labels";	
			flg.className = 'regCol';	
			val.innerHTML = "Address";
			val.className = 'regCol';
			row.appendChild(flg);
			row.appendChild(val);
		lblTable.appendChild(row);

		row = document.createElement('tr');
			val = document.createElement('td');
			flg = document.createElement('td');
			flg.innerHTML = "Const";	
			flg.className = 'regCol';	
			val.innerHTML = "Value";
			val.className = 'regCol';
			row.appendChild(flg);
			row.appendChild(val);
		cnsTable.appendChild(row);
	};

	var Core = function(){
		var _core 			= this,
			PC 				= 0x6800;
			flagsData 		= {},
			labels 		    = {},
			consts 		    = {},
			registers       = {},
			offset 			= 0x6800,
			changedRows 	= [],
			binaryDump 		= [],
			endDump			= [],
			dumpString 		= "",
			wordCounter 	= 0,
			strID 			= 0,
			strEndID        = 0,
			endString		= 0,
			endCounter		= 0,
			stepPress 		= false,
			runPress		= false,
			resetPress 		= false,
			executePress 	= false,
			commandCounter  = 0,
			srcString 		= "";


		// slots src and dst ----------------------------

			var slot0_src = ["R0","R1","R2","R3","R4","R5","R6","R7","R8","R9","R10","R11","R12","R13","R14","IP","DATA","ADD","ADDC",
							 "SUB","XOR","AND","STATE","SH.R","P.IN"];

			var slot1_src = ["R0","R1","R2","R3","R4","R5","R6","R7","R8","R9","R10","R11","R12","R13","R14","IP","DATA","ADD","ADDC",
							 "SUB","XOR","AND","STATE","SH.R","P.IN","CONST10","CONST16"];

			var slot2_src = ["R0","R1","R2","R3","R4","R5","R6","R7","R8","R9","R10","R11","R12","R13","R14","IP","LINK","ADD","ADDC",
							 "SUB","XOR","AND","STATE","SH.R","P.IN","CONST10","CONST16"];

			var slot0_dst = ["R0","R1","R2","R3","R4","R5","R6","R7","R8","R9","R10","R11","R12","R13","R14","IP","pADDR","DATA","ADD.A",
							 "ADD.B","AND.A","AND.B","SUB.A","SUB.B","SH","ADDC.A","ADDC.B","XOR.A","XOR.B","STATE","P.OUT","NULL"];

			var slot1_dst = ["R0","R1","R2","R3","R4","R5","R6","R7","R8","R9","R10","R11","R12","R13","R14","IP","pADDR","DATA","ADD.A",
							 "ADD.B","AND.A","AND.B","SUB.A","SUB.B","SH","ADDC.A","ADDC.B","XOR.A","XOR.B","STATE","P.OUT","NULL"];

			var slot2_dst = ["R0","R1","R2","R3","R4","R5","R6","R7","R8","R9","R10","R11","R12","R13","R14","IP","ADDR","DATA","ADD.A",
							 "ADD.B","AND.A","AND.B","SUB.A","SUB.B","SH","ADDC.A","ADDC.B","XOR.A","XOR.B","STATE","P.OUT","NULL"];

			var flags	= ["NZ?","NC?","Z?","C?","S?","E?"];

		//-------------------------------------------------

		// registers and flags---------------------------

			registers["R0"]   	= {addr:0,value:0};
			registers["R1"]   	= {addr:1,value:0};
			registers["R2"]   	= {addr:2,value:0};
			registers["R3"]   	= {addr:3,value:0};
			registers["R4"]   	= {addr:4,value:0};
			registers["R5"]   	= {addr:5,value:0};
			registers["R6"]   	= {addr:6,value:0};
			registers["R7"]   	= {addr:7,value:0};
			registers["R8"]   	= {addr:8,value:0};
			registers["R9"]   	= {addr:9,value:0};
			registers["R10"]  	= {addr:10,value:0};
			registers["R11"]  	= {addr:11,value:0};
			registers["R12"]  	= {addr:12,value:0};
			registers["R13"]  	= {addr:13,value:0};
			registers["R14"]  	= {addr:14,value:0};
			registers["IP"]   	= {addr:15,value:0};
			registers["pADDR"]  = {addr:16,value:0};
			registers["ADDR"]   = {addr:16,value:0};
			registers["DATA"]   = {addr:17,value:0};
			registers["ADD.A"]  = {addr:18,value:0};
			registers["ADD.B"]  = {addr:19,value:0};
			registers["AND.A"]  = {addr:20,value:0};
			registers["AND.B"]  = {addr:21,value:0};
			registers["SUB.A"]  = {addr:22,value:0};
			registers["SUB.B"]  = {addr:23,value:0};
			registers["SH"]     = {addr:24,value:0};
			registers["ADDC.A"] = {addr:25,value:0};
			registers["ADDC.B"] = {addr:26,value:0};
			registers["XOR.A"]  = {addr:27,value:0};
			registers["XOR.B"]  = {addr:28,value:0};
			registers["STATE"]  = {addr:29,value:0};
			registers["P.OUT"]  = {addr:30,value:0};
			registers["NULL"]   = {addr:31,value:0};

			registers["sDATA"]    = {addr:15,value:0};
			registers["LINK"]    = {addr:15,value:0};
			registers["ADD"]     = {addr:16,value:0};
			registers["ADDC"]    = {addr:17,value:0};
			registers["SUB"]     = {addr:18,value:0};
			registers["XOR"]     = {addr:19,value:0};
			registers["AND"]     = {addr:20,value:0};
			registers["sSTATE"]   = {addr:21,value:0};
			registers["SH.R"]  	 = {addr:22,value:0};
			registers["P.IN"]  	 = {addr:23,value:0};
			registers["CONST10"] = {addr:24,value:0};
			registers["CONST16"] = {addr:25,value:0};

			flagsData["C-1"] = 0;
			flagsData["Z-1"] = 0;
			flagsData["S-1"] = 0;
			flagsData["E-1"] = 0;

			flagsData["C-2"] = 0;
			flagsData["Z-2"] = 0;
			flagsData["S-2"] = 0;
			flagsData["E-2"] = 0;

		// ------------------------------------------------

		var getSRC_ADDR = function(slot, src) {
			switch(slot){
				case 0:
				 return slot0_src.indexOf(src);
				 break;
				case 1:
				 return slot1_src.indexOf(src);
				 break;
				case 2:
				 return slot2_src.indexOf(src);
				 break;
			}
		}

		var getDST_ADDR = function(slot, dst) {
			switch(slot){
				case 0:
				 return slot0_dst.indexOf(dst);
				 break;
				case 1:
				 return slot1_dst.indexOf(dst);
				 break;
				case 2:
				 return slot2_dst.indexOf(dst);
				 break;
			}
		};

		var getSlotCandidats = function(s,d,_sf,_cdtn){
			var _slots = [];

			if(_sf === false && _cdtn === "" && getSRC_ADDR(0,s) > -1 && getDST_ADDR(0,d) > -1)
				_slots.push(0);

			if(getSRC_ADDR(1,s) > -1 && getDST_ADDR(1,d) > -1)
				_slots.push(1);

			if(getSRC_ADDR(2,s) > -1 && getDST_ADDR(2,d) > -1)
				_slots.push(2);

			if(getSRC_ADDR(0,s) === -1 && getSRC_ADDR(1,s) === -1 && getSRC_ADDR(2,s) === -1)
				errorCanvas.drawError('Console 12pt', 'ERROR: SRC ' + s + ' not found...', 5, 30, '#000');

			if(getDST_ADDR(0,d) === -1 && getDST_ADDR(1,d) === -1 && getDST_ADDR(2,d) === -1)
				errorCanvas.drawError('Console 12pt', 'ERROR: DST ' + d +' not found...', 5, 50, '#000');

			return _slots;
		};

		var parseCommand = function(command){

			if(command === "")
				return -1;

			var _src  = "",
				_dst  = "",
				_cdtn = "",
				_slots = [],
				_c10  = false,
				_c16  = false,
				_sf   = false,
				_const = "-",
				_priority = -1;

			//1. ############-condition-##################################
				if(command.indexOf('?') > -1) 
				{
					for(var i = 0; i < flags.length; i++){
						var f = flags[i];
						if(command.indexOf(f) > -1){
							command = command.replace(f,"").trim();
							_cdtn = f;
						}
					}
				}
			//############-condition-#####################################

			//1.1 ############-labels-####################################
				if(command.indexOf(':') > -1) 
				{
					var labelPos = command.indexOf(':'),
						labelName = command.substring(0, labelPos);

					command = command.replace(labelName + ":",'').trim();
					labels[labelName] = PC;

					if(command === "")
						return -1;
				}
			//############-labels-########################################

			//2. ############-SRC-DST-####################################
				if(command.indexOf('->') > -1 || command.indexOf('=>') > -1)
				{
					var srcdst = [];

					if(command.indexOf('->') > -1)
						srcdst = command.split('->');

					if(command.indexOf('=>') > -1) {
						srcdst = command.split('=>');
						_sf  = true;
					}

					_src = srcdst[0].trim();
					_dst = srcdst[1].trim();

					//2.1 ############-labelCall-####################################
						if(_src.indexOf('&') > -1) {
							_src = _src.replace('&','');
							_src = '#'+labels[_src];
						}
					//############-labels-########################################
				}
				else
				{
					if(command.indexOf('.ORG') > -1)
					{
						var str = command.replace(".ORG"," ").trim();
						if(str.indexOf('0x') > -1)
						{
							str = str.replace('0x','').trim();
							str = toDec(str);
						}
						else
							str = toDec(str);

						offset = str;
						PC = offset;
						codeDump.value += "SET PC = 0x" + toHex2(toBin(offset)).result + "\n";
					}
					else if(command.indexOf('.SET') > -1)
					{
						var str = command.replace(".SET"," ").trim(),
							spacePos = str.indexOf(' '),
							n = str.substring(0, spacePos).trim(),
							v = str.substring(spacePos + 1, str.length).trim();
						consts[n] = v;
					}
					else if(command.indexOf('END') > -1)
					{
						codeDump.value += "Program end!" + "\n";
						codeDump.value += commandCounter + " commands compiled..." + "\n";
					}
					else
					{
						errorCanvas.drawError('Console 12pt', 'ERROR: -> or => not found...', 5, 30, '#000');
						codeEditor.selectErrorLine();
					}

					return -1;
				}
			//############-SRC-DST-####################################

			//3. ############-Const10/16-#################################
				if(_src.indexOf('#') > -1){
					_src = _src.replace('#','').trim();

					if(_src.indexOf('0x') > -1){
						_src = _src.replace('0x','').trim();
						_src = toDec(_src);
					}
					else
					{
						var s = parseInt(_src);
						if(isNaN(s))
							_src = consts[_src];
						else
							_src = s;
					}

					(_src > 0x3FF) ? _c16 = true : _c10 = true;				
				}
			//############-Const10/16-#################################

			//4. ############-Find slot candidats-########################
				if(!_c16 && !_c10)
					_slots = getSlotCandidats(_src,_dst,_sf,_cdtn);
				else{
					_const = _src;
					(_src > 0x3FF) ? _src = 'CONST16' : _src = 'CONST10';
					_slots = getSlotCandidats(_src,_dst,_sf,_cdtn);
				}

				_priority = _slots.length;
			//############-Find slot candidats-########################
	
			if(_sf)
				_cdtn = 'SF';

			return {src:_src, dst:_dst, cdtn:_cdtn, const10:_c10, const16:_c16, sf:_sf, candidats:_slots, const10_16:_const, priority:_priority}	
		};

		var parseBundle = function(bundle){
			//-. ############-tabulators-###################################
				bundle = bundle.replace('\t','');

			//0. ############-comments-###################################
				var commentBegin = bundle.indexOf(';');	

				if(commentBegin < 0)
					commentBegin = bundle.indexOf('//');	

				if(commentBegin > -1) 
					bundle = bundle.substring(0, commentBegin).trim();
			//############-comments-######################################	

			var commands = bundle.split(',');
			for(var i = 0; i < commands.length; i++)
				commands[i] = commands[i].trim();
			return commands;
		};

		var get10bitFromConst = function(value){
			var bin = toBin(value),
				dt = 16 - bin.length,
				n = '';		
			for(var i = 0; i < dt; i++)
				n += '0';
			bin = n + bin;
			return bin.substring(6,16);
		};

		var get5bitFromConst = function(value){
			var bin = toBin(value),
				dt = 5 - bin.length,
				n = '';
			for(var i = 0; i < dt; i++)
				n += '0';
			bin = n + bin;
			return bin;
		};

		var get16bitFromConst = function(value){
			var bin = toBin(value),
				dt = 16 - bin.length,
				n = '';
			for(var i = 0; i < dt; i++)
				n += '0';
			bin = n + bin;
			return bin;
		};

		var getFlagBits = function(value){
			var bits = '0';
			switch(value)
			{
				case '': 
					bits = '000';
					break;
				case 'NZ?': 
					bits = '010';
					break;
				case 'Z?': 
					bits = '001';
					break;
				case 'C?': 
					bits = '011';
					break;
				case 'NC?': 
					bits = '100';
					break;
				case 'S?': 
					bits = '101';
					break;
				case 'E?': 
					bits = '110';
					break;
				case 'SF': 
					bits = '111';
					break;	
				default:
					bits = value;
					break;
			}

			return bits;
		}

		var drawSlots = function(slots,drawRegisters){

			if(slots[0].isNull && slots[1].isNull && slots[2].isNull)
				return;

			if(drawRegisters)
			{
				if(slots[0] !== null)
				{
					var s0HTML = null,
						cnst   = null;

					if(slots[0].const16 !== undefined){
						s0HTML = "c16"; 
						cnst = slots[0].const16;
					}
					else 
					{
						s0HTML = "c10";
						cnst = slots[0].const10;
					}

					if(cnst != undefined && cnst !== null){
						SlotsTable.values.slot0src.innerHTML = cnst.substring(5,10);
						SlotsTable.values.slot0dst.innerHTML = cnst.substring(0,5);
						SlotsTable.exp.slot0src.innerHTML = s0HTML + "5bit(l)";
						SlotsTable.exp.slot0dst.innerHTML = s0HTML + "5bit(h)";
					}
					else{
						SlotsTable.values.slot0src.innerHTML = getSRC_ADDR(0, slots[0].src);
						SlotsTable.values.slot0dst.innerHTML = getDST_ADDR(0, slots[0].dst);
						SlotsTable.exp.slot0src.innerHTML = slots[0].src;
						SlotsTable.exp.slot0dst.innerHTML = slots[0].dst;
					}
				}

				if(slots[1] != null)
				{
					SlotsTable.values.slot1src.innerHTML = getSRC_ADDR(1, slots[1].src);
					SlotsTable.values.slot1dst.innerHTML = getDST_ADDR(1, slots[1].dst);
					SlotsTable.exp.slot1src.innerHTML = slots[1].src;
					SlotsTable.exp.slot1dst.innerHTML = slots[1].dst;
					SlotsTable.values.slot1cdtn.innerHTML = getFlagBits(slots[1].cdtn);

					if(slots[0].const16 === undefined){
						if(slots[1].sf)
							SlotsTable.exp.slot1cdtn.innerHTML = 'SF';
						else
						{
							if(slots[1].cdtn === '')
						  		SlotsTable.exp.slot1cdtn.innerHTML = '-';
							else
						  		SlotsTable.exp.slot1cdtn.innerHTML = slots[1].cdtn;
						}
					}
					else
						SlotsTable.exp.slot1cdtn.innerHTML = 'C16 3bit';
				}

				if(slots[2] != null)
				{
					SlotsTable.values.slot2src.innerHTML = getSRC_ADDR(2, slots[2].src);
					SlotsTable.values.slot2dst.innerHTML = getDST_ADDR(2, slots[2].dst);
					SlotsTable.exp.slot2src.innerHTML = slots[2].src;
					SlotsTable.exp.slot2dst.innerHTML = slots[2].dst;
					SlotsTable.values.slot2cdtn.innerHTML = getFlagBits(slots[2].cdtn);

					if(slots[0].const16 === undefined){
						if(slots[2].sf)
							SlotsTable.exp.slot2cdtn.innerHTML = 'SF';
						else
						{
							if(slots[2].cdtn === '')
						  		SlotsTable.exp.slot2cdtn.innerHTML = '-';
							else
						  		SlotsTable.exp.slot2cdtn.innerHTML = slots[2].cdtn;
						}
					}
					else
						SlotsTable.exp.slot2cdtn.innerHTML = 'C16 3bit';
				}
			}

			var ss0 = 0;
			var sd0 = 0;

			var ss1 = 0;
			var sd1 = 0;
			var sc1 = '000';

			var ss2 = 0;
			var sd2 = 0;
			var sc2 = '000';

			if(slots[0] !== null && slots[0].src !== undefined && slots[0].dst !== undefined)
			{
				ss0 = get5bitFromConst(getSRC_ADDR(0,slots[0].src));
				sd0 = get5bitFromConst(getDST_ADDR(0,slots[0].dst));
			}
			else if(slots[0] !== null && slots[0].const16 !== undefined){
				ss0 = slots[0].const16;
				sd0 = '';
			}

			else if (slots[0] !== null && slots[0].const10 !== undefined){
				ss0 = slots[0].const10;
				sd0 = '';
			}

			if(slots[1] !== null && slots[1].src !== undefined && slots[1].dst !== undefined)
			{
				ss1 = get5bitFromConst(getSRC_ADDR(1,slots[1].src));
				sd1 = get5bitFromConst(getDST_ADDR(1,slots[1].dst));
				if(slots[1].cdtn !== '')
					sc1 = getFlagBits(slots[1].cdtn);
			}

			if(slots[2] !== null && slots[2].src !== undefined && slots[2].dst !== undefined)
			{
				ss2 = get5bitFromConst(getSRC_ADDR(2,slots[2].src));
				sd2 = get5bitFromConst(getDST_ADDR(2,slots[2].dst));
				if(slots[2].cdtn !== '')
					sc2 = getFlagBits(slots[2].cdtn);
			}

			var sr0 = sd0 + ss0;
			var sr1 = sc1 + sd1 + ss1;
			var sr2 = sc2 + sd2 + ss2;
			var bin = sr2 + sr1 + sr0;

			binBundle.innerHTML = bin;
			hexBundle.innerHTML = toHex2(sr2 + sr1 + sr0).result;
	
			//#########################################CREATE DUMP######################################################
				codeDump.value += commandCounter + ") " + hexBundle.innerHTML + "     [ " + srcString + " ]\n";

				var bstr = bin.substring(4,36);
				var send = bin.substring(0, 4);

				var sstr = toHex2(bstr).result;
				var estr = toHex2(send).result;

				if(wordCounter !== 0)
					sstr = sstr + "_";

				if(endCounter !== 0)
					estr = estr + "_";

				dumpString = sstr + dumpString;
				endString  = estr + endString;

				wordCounter++;
				endCounter++;
				PC++;
				commandCounter++;

				if(endCounter > 63)
				{
					endDump.push(".INITP_0" + strEndID + "(256'h" + endString + "),");
					endString  = "";
					endCounter = 0;
					strEndID++;
				}

				if(wordCounter > 7)
				{
					if(strID < 0x10)
						binaryDump.push(".INIT_0" + toHex2(toBin(strID)).result + "(256'h" + dumpString + "),");
					else
						binaryDump.push(".INIT_" + toHex2(toBin(strID)).result + "(256'h" + dumpString + "),");

					dumpString  = "";
					wordCounter = 0;
					strID++;
				}
			//#########################################CREATE DUMP######################################################
		};

		var getBundleSlots = function(bundle){
			var commands = parseBundle(bundle);
			var slots = [null,null,null];
			var parsedCommands = [];

			for(var i = 0; i < commands.length; i++){
				var command = parseCommand(commands[i]);
				if(command !== -1)
					parsedCommands.push(command);
			}

			if(parsedCommands.length > 0)
			{
				srcString = bundle.trim();
				var c = srcString.indexOf(';');
				if(c > -1)
					srcString = srcString.substring(0, c).trim();
			}

			//############-Create slots-#################################

				var const16A = null,
					const10A = null,
					const16E = false,
					const10E = false;

					parsedCommands.sort(function(a,b){
						if(a.priority < b.priority) return -1;
					 	if(a.priority > b.priority) return 1;		 
					  	return 0;
					});

					for(var j = 0; j < parsedCommands.length; j++){
						var cmd = parsedCommands[j];
						var r = false;

						if(cmd.const10_16 !== '-'){
							if(const16E){
								errorCanvas.drawError('Console 12pt', 'ERROR: Const16 already defined...', 5, 30, '#000');
								codeEditor.selectErrorLine();
							}

							if(const10E){
								if(cmd.const10_16 !== const10A){
									errorCanvas.drawError('Console 12pt', 'ERROR: Const10 and Const10 not equals...', 5, 30, '#000');
									codeEditor.selectErrorLine();
								}
							}

							if(cmd.const10 && !const10E){
								var c = get16bitFromConst(cmd.const10_16);
								const10A = cmd.const10_16;
								slots[0] = {const10:c.substring(6,16)};
								const10E = true;
							}

							if(cmd.const16){
								var _fullConst = cmd.const10_16;
								cmd.const10_16 = cmd.const10_16 % 0x10000;
								var c = get16bitFromConst(cmd.const10_16);
								slots[0] = {const16:c.substring(6,16), fullconst:_fullConst};
								slots[1] = {};
								slots[2] = {};
								slots[1].cdtn = c.substring(3,6);
								slots[2].cdtn = c.substring(0,3);
								const16E = true;
							}
						}

						for(var i = 0; i < cmd.candidats.length; i++)	
						{	
							switch(cmd.candidats[i]){
								case 0:
									if (slots[0] !== null) continue;
									slots[0] = {src:cmd.src, dst:cmd.dst};
									r = true;
									break;
								case 1:
									if(slots[1] !== null && ('cdtn' in slots[1]))
									{
										if(cmd.cdtn !== ''){
											if(const16E){
												errorCanvas.drawText('Console 12pt', 'ERROR: CONST16 defined condition bits disabled...', 5, 30, '#000');	
												codeEditor.selectErrorLine();
											}
										}

										if(slots[1].src === undefined && slots[1].src === undefined){
											slots[1] = {src:cmd.src, dst:cmd.dst, cdtn:slots[1].cdtn, sf:cmd.sf};
											r = true;
										}
									}
									else if(slots[1] === null){
										slots[1] = {src:cmd.src, dst:cmd.dst, cdtn:cmd.cdtn, sf:cmd.sf};
										r = true;
									}
									else
										continue;

									break;
								case 2:
									if(slots[2] !== null && ('cdtn' in slots[2]))
									{
										if(cmd.cdtn !== ''){
											if(const16E){
												errorCanvas.drawError('Console 12pt', 'ERROR: CONST16 defined condition bits disabled...', 5, 30, '#000');	
												codeEditor.selectErrorLine();
											}
										}

										if(slots[2].src === undefined && slots[2].src === undefined){
											slots[2] = {src:cmd.src, dst:cmd.dst, cdtn:slots[2].cdtn, sf:cmd.sf};
											r = true;
										}
									}
									else if(slots[2] === null){
										slots[2] = {src:cmd.src, dst:cmd.dst, cdtn:cmd.cdtn, sf:cmd.sf};
										r = true;
									}
									else
										continue;
									break;
							}

							if(r)
								break;
						}
					}

				if(slots[0] === null)
					slots[0] = {src:'R0', dst:'NULL', isNull:true};	

				if(slots[1] === null)
					slots[1] = {src:'R0', dst:'NULL', cdtn:'', sf:false, isNull:true};	
				else if(slots[1].src === undefined && slots[1].dst === undefined){
					if(slots[1].cdtn === undefined)
						slots[1] = {src:'R0', dst:'NULL', cdtn:'', sf:false};	
					else
						slots[1] = {src:'R0', dst:'NULL', cdtn:slots[1].cdtn, sf:false};
				}
				
				if(slots[2] === null)
					slots[2] = {src:'R0', dst:'NULL',cdtn:'', sf:false, isNull:true};	
				else if(slots[2].src === undefined && slots[2].dst === undefined){
					if(slots[2].cdtn === undefined)
						slots[2] = {src:'R0', dst:'NULL', cdtn:'', sf:false};	
					else
						slots[2] = {src:'R0', dst:'NULL', cdtn:slots[2].cdtn, sf:false};
				}
				
			return slots;
		};

		//############-Create slots-#################################

		_core.drawRegisters = function(){
			destroyChildren(srcTable);
			destroyChildren(dstTable);
			destroyChildren(flgTable);
			destroyChildren(lblTable);
			destroyChildren(cnsTable);

			var c = 0;

			createHeaders();

			for (p in registers)
			{
				var register = registers[p];

				var row = document.createElement('tr');
				row.setAttribute("id", "row" + c);

				var addr = document.createElement('td');
					addr.innerHTML = toHex(register.addr);

				var reg = document.createElement('td');
					reg.className = 'regCol';

				var val = document.createElement('td');
					val.className = 'dstStyle';

				reg.innerHTML = p;		
				val.innerHTML = toHex(register.value);

				row.appendChild(addr);
				row.appendChild(reg);
				row.appendChild(val);
				dstTable.appendChild(row);

				if(changedRows.indexOf(p) > -1)
					selectRow('row', c);

				c++;

				if(c > 32)
					break;
			}

			c = 0;
			for (p in registers)
			{
				if(c > 32) {
					var register = registers[p];

					var row = document.createElement('tr');
					row.setAttribute("id", "row" + c);

					var addr = document.createElement('td');
						addr.innerHTML = toHex(register.addr);

					var reg = document.createElement('td');
						reg.className = 'regCol';

					var val = document.createElement('td');
						val.className = 'srcStyle';

					reg.innerHTML = p;		
					val.innerHTML = toHex(register.value);

					row.appendChild(addr);
					row.appendChild(reg);
					row.appendChild(val);
					srcTable.appendChild(row);

					if(changedRows.indexOf(p) > -1)
						selectRow('row', c);
				}
				c++;
			}

			changedRows = [];

			c = 0;

			for(p in flagsData){
				var row = document.createElement('tr');
				row.setAttribute("id", "flg" + c);

				var flg = document.createElement('td');
				flg.className = 'regCol';

				var val = document.createElement('td');
				flg.innerHTML = p;		
				val.innerHTML = flagsData[p];

				row.appendChild(flg);
				row.appendChild(val);
				flgTable.appendChild(row);
				c++;
			}

			c = 0;

			for(p in labels){
				var row = document.createElement('tr');
				row.setAttribute("id", "flg" + c);

				var flg = document.createElement('td');
				flg.className = 'regCol';

				var val = document.createElement('td');
				flg.innerHTML = p;		
				val.innerHTML = toHex(labels[p]);

				row.appendChild(flg);
				row.appendChild(val);
				lblTable.appendChild(row);
				c++;
			}

			c = 0;

			for(p in consts){
				var row = document.createElement('tr');
				row.setAttribute("id", "cns" + c);

				var cns = document.createElement('td');
				cns.className = 'regCol';
				cns.innerHTML = p;

				var val = document.createElement('td');	
				val.innerHTML = consts[p];
				val.className = 'regCol';

				row.appendChild(cns);
				row.appendChild(val);
				cnsTable.appendChild(row);
				c++;
			}
		};

		var selectRow = function(prefix, num){
			var id = prefix + num;
			var row = document.getElementById(id);
			row.className = "changedRowColor";
			clearClassChildren(row);
		};

		var calculateFlags = function(value,slot){
			(value > 0x8000) ? flagsData["S-"+slot] = 1 : flagsData["S-"+slot] = 0;
			(value === 0)    ? flagsData["Z-"+slot] = 1 : flagsData["Z-"+slot] = 0;
		};

		var calculateFlags2 = function(value,slot){
			(value > 0x8000) ? flagsData["S-"+slot] = 1 : flagsData["S-"+slot] = 0;
			(value === 0)    ? flagsData["Z-"+slot] = 1 : flagsData["Z-"+slot] = 0;
			(value > 0xFFFF) ? flagsData["C-"+slot] = 1 : flagsData["C-"+slot] = 0;
		};

		var add  = function(){ 
			var value = registers["ADD.A"].value  + registers["ADD.B"].value;
			registers["ADD"].value = value % 0x10000;
			return value;
		};

		var sub  = function(){ 
			registers["SUB"].value = registers["SUB.B"].value  - registers["SUB.A"].value;
			return registers["SUB"].value;
		};

		var addc = function(){
			var value = registers["ADDC.A"].value  + registers["ADDC.B"].value + flags.C;
			registers["ADDC"].value = value % 0x10000;
			return value;
		};

		var xor  = function(){
			registers["XOR"].value  = registers["XOR.B"].value  ^ registers["XOR.A"].value;
			return registers["XOR"].value;
		};

		var shr  = function(){
			var shr = registers["SH"].value >>> 1;
			registers["SH"].value   = shr % 0x10000;
			registers["SH.R"].value = shr % 0x10000;
			return shr;
		};

		var isFunction = function(src){
			var result = false;
			switch(src)
			{
				case "ADD":
					result = true;
					break;
				case "ADDC":
					result = true;
					break;
				case "SUB":
					result = true;
					break;
				case "XOR":
					result = true;
					break;
				case "SH.R":
					result = true;
					break;
			}

			return result;
		}

		var calculateFunction = function(func){
			var result = 0;
			switch(func)
			{
				case "ADD":
					result = add();
					changedRows.push(func);
					break;
				case "ADDC":
					result = addc();
					changedRows.push(func);
					break;
				case "SUB":
					result = sub();
					changedRows.push(func);
					break;
				case "XOR":
					result = xor();
					changedRows.push(func);
					break;
				case "SH.R":
					result = shr();
					changedRows.push(func);
					break;
			}

			return result;
		};

		var runSlots = function(slots){

			if(slots[0].isNull && slots[1].isNull && slots[2].isNull)
				return;

			var slot0 = slots[0],
				slot1 = slots[1],
				slot2 = slots[2],
				s0 	  = slot0.src,
				d0 	  = slot0.dst,
				s1 	  = slot1.src,
				d1 	  = slot1.dst,
				s2 	  = slot2.src,
				d2 	  = slot2.dst,
				val0  = 0,
				val1  = 0,
				val2  = 0,
				src0  = registers[s0],
				src1  = registers[s1],
				src2  = registers[s2];

			if(slot0.const10 || slot0.const16)
			{
				if(slot0.const10){
					registers["CONST10"].value = parseInt(slot0.const10, 2);
					changedRows.push("CONST10");
				}

				if(slot0.const16){
					var c16 = slot2.cdtn + slot1.cdtn + slot0.const16;
					registers["CONST16"].value = parseInt(c16, 2);
					changedRows.push("CONST16");
				}

				changedRows.push(d1);
				changedRows.push(d2);

				val1 = src1.value;
				val2 = src2.value;

				if(!isFunction(s1))
					calculateFlags(val1, 1);
				else
				{
					val1 = calculateFunction(s1);
					calculateFlags2(val1,1);
				}
	
				if(!isFunction(s2))
					calculateFlags(val2, 2);
				else
				{
					val2 = calculateFunction(s2);
					calculateFlags2(val2,2);
				}

				registers[d1].value = val1;
				registers[d2].value = val2;	
			}
			else
			{
				var a = [];
				if(d0 != 'NULL')
					a.push({id:0,reg:d0, src:s0});
				if(d1 != 'NULL')
					a.push({id:1,reg:d1, src:s1});
				if(d2 != 'NULL')
					a.push({id:2,reg:d2, src:s2});

				val0 = src0.value;
				val1 = src1.value;
				val2 = src2.value;

				var executeSlot = function(id, isOR){
					switch(id)
					{
						case 0:
							if(isOR === undefined || isOR.length === 0)
							{
								if(isFunction(s0))
									val0 = calculateFunction(s0);	
								registers[d0].value = val0;
							}
							else
							{
								for(var i = 0; i < isOR.length; i++)
									registers[d0].value |= registers[isOR[i]].value;
							}
							registers[d0].value = val1 % 0x10000;
							changedRows.push(d0);
							break;
						case 1:
							if(isOR === undefined || isOR.length === 0)
							{
								if(!isFunction(s1))
									calculateFlags(src1.value, 1);
								else
								{
									val1 = calculateFunction(s1);
									calculateFlags2(val1,1);
								}
							}
							else
							{
								for(var i = 0; i < isOR.length; i++)
									registers[d1].value |= registers[isOR[i]].value;

								calculateFlags(registers[d1].value, 1);
							}
							registers[d1].value = val1 % 0x10000;
							changedRows.push(d1);
							break;
						case 2:
							if(isOR === undefined || isOR.length === 0)
							{
								if(!isFunction(s2))
									calculateFlags(src2.value, 2);
								else
								{
									val2 = calculateFunction(s2);
									calculateFlags2(val2,2);
								}
							}
							else
							{
								for(var i = 0; i < isOR.length; i++)
									registers[d2].value |= registers[isOR[i]].value;

								calculateFlags(registers[d2].value, 2);
							}
							registers[d2].value = val2 % 0x10000;
							changedRows.push(d2);
							break;
					}
				};

				if(a.length === 1)
					executeSlot(a[0].id);
				else if(a.length === 2)
				{
					if(a[0].reg !== a[1].reg){
						executeSlot(a[0].id);
						executeSlot(a[1].id);
					}
					else
					{
						var isOR = [];
						isOR.push(a[0].src);
						isOR.push(a[1].src);
						executeSlot(a[0].id, isOR);
						//alert(a[0].reg);
					}
				}
				else if(a.length === 3)
				{
					if(a[0].reg !== a[1].reg && a[0].reg !== a[2].reg && a[1].reg !== a[2].reg){
						executeSlot(a[0].id);
						executeSlot(a[1].id);
						executeSlot(a[2].id);
					}
					//else
						//alert(a[0].reg);
				}

				/*if(d0 !== d1 && d1 !== d2 && d0 !== d2)	
				{
					if(!isFunction(s1))
						calculateFlags(src1.value, 1);
					else
					{
						val1 = calculateFunction(s1);
						calculateFlags2(val1,1);
					}

					if(!isFunction(s2))
						calculateFlags(src2.value, 2);
					else
					{
						val2 = calculateFunction(s2);
						calculateFlags2(val2,2);
					}

					registers[d0].value = registers[s0].value;
					registers[d1].value = val1;
					registers[d2].value = val2;

					changedRows.push(d0);
					changedRows.push(d1);
					changedRows.push(d2);
				}
				else
				{
					if(d0 === d1 && d1 === d2 && d0 === d2)
					{
						registers[d0].value = registers[s0].value | registers[s1].value | registers[s2].value;
						changedRows.push(d0);
					}
					else
					{
						if(d0 === d1){
							registers[d0].value = registers[s0].value | registers[s1].value;
							registers[d2].value = registers[s2].value;
							changedRows.push(d0);
							changedRows.push(d2);
						}
						else if(d1 === d2){
							registers[d1].value = registers[s1].value | registers[s2].value;
							registers[d0].value = registers[s0].value;
							changedRows.push(d0);
							changedRows.push(d1);
						}
						else if(d0 === d2){
							registers[d1].value = registers[s1].value;
							registers[d0].value = registers[s0].value | registers[s2].value;	
							changedRows.push(d0);	
							changedRows.push(d1);	
						}
					}
				}*/
			}
		};

		_core.loadProgram = function(){
			_core.reset();
			_core.run();
			_core.reset();
			core.drawRegisters();
			codeDump.value += "Program executed... done!" + "\n";
		};

		_core.refresh = function(){
			core.drawRegisters();
		};

		_core.run = function(){

			console.time("run-step");
				for(var i = 0; i < codeEditor.getLinesCount(); i++)
					_core.step(false);

				if(wordCounter > 0)
				{
					for(var i = 0; i < 8 - wordCounter; i++)
					{
						if(i === 0)
							dumpString = "_00000000_" + dumpString;
						else if(i === 7 - wordCounter)
							dumpString = "00000000" + dumpString;
						else
							dumpString = "_00000000" + dumpString;
					}

					if(strID < 0x10)
						binaryDump.push(".INIT_0" + toHex2(toBin(strID)).result + "(256'h" + dumpString + "),");
					else
						binaryDump.push(".INIT_" + toHex2(toBin(strID)).result + "(256'h" + dumpString + "),");
				}

				if(endCounter > 0)
				{
					for(var i = 0; i < 64 - endCounter; i++)
					{
						if(i === 0)
							endString = "_0_" + endString;
						else if(i === 63 - endCounter)
							endString = "0" + endString;
						else
							endString = "_0" + endString;
					}

					if(strEndID < 0x10)
						endDump.push(".INITP_0" + toHex2(toBin(strEndID)).result + "(256'h" + endString + "),");
				}

				for(var i = 0; i < binaryDump.length; i++)
					codeDump.value += binaryDump[i] + "\n";

				for(var i = 0; i < endDump.length; i++)
					codeDump.value += endDump[i] + "\n";

			console.timeEnd("run-step");
		};

		_core.step = function(drawRegisters){
			var s = codeEditor.step(drawRegisters);
			var slots = getBundleSlots(s);
			//runSlots(slots)
			drawSlots(slots, drawRegisters);
			if(drawRegisters)
			{
				errorCanvas.clearColor('#cfc');
				_core.refresh();
			}
		};

		_core.reset = function(){
			destroyChildren(srcTable);
			destroyChildren(dstTable);
			destroyChildren(flgTable);
			//destroyChildren(lblTable);

			SlotsTable.values.slot0src.innerHTML = '*';
			SlotsTable.values.slot0dst.innerHTML = '*';
			SlotsTable.exp.slot0src.innerHTML = '*';
			SlotsTable.exp.slot0dst.innerHTML = '*';

			SlotsTable.values.slot1src.innerHTML = '*';
			SlotsTable.values.slot1dst.innerHTML = '*';
			SlotsTable.exp.slot1src.innerHTML = '*';
			SlotsTable.exp.slot1dst.innerHTML = '*';
			SlotsTable.values.slot1cdtn.innerHTML = '*';
			SlotsTable.exp.slot1cdtn.innerHTML = '*';

			SlotsTable.values.slot2src.innerHTML = '*';
			SlotsTable.values.slot2dst.innerHTML = '*';
			SlotsTable.exp.slot2src.innerHTML ='*';
			SlotsTable.exp.slot2dst.innerHTML = '*';
			SlotsTable.values.slot2cdtn.innerHTML = '*';
			SlotsTable.exp.slot2cdtn.innerHTML = '*';

			binBundle.innerHTML = '000000000000000000000000000000000000';
			hexBundle.innerHTML = '0x00000000';
			//codeDump.value = '';
			codeDump.value = '';

			dumpString 		= "";
			wordCounter 	= 0;
			binaryDump		= [];
			strID 			= 0;
			strEndID 		= 0;
			commandCounter  = 0;

			endDump = [];
			endString = '';
			endCounter = 0;
			PC = 0x6800;

			flagsData["C-1"] = 0;
			flagsData["Z-1"] = 0;
			flagsData["S-1"] = 0;
			flagsData["E-1"] = 0;

			flagsData["C-2"] = 0;
			flagsData["Z-2"] = 0;
			flagsData["S-2"] = 0;
			flagsData["E-2"] = 0; 
			//labels = {};

			for(register in registers)
				registers[register].value = 0;

			codeEditor.reset();

			core.drawRegisters();
			codeDump.value += "Program reset... done!" + "\n";
		};
	};

	_compiler.getCore = function(){return core;};
	var core = new Core();	
	core.refresh();

	var checkKeys = function(event){
		if(event.ctrlKey && event.keyCode === 53){
			core.step(true);
			return false;
		}

		if(event.ctrlKey && event.keyCode === 54){
			core.run();
			return false;
		}

		if(event.ctrlKey && event.keyCode === 82){
			core.reset();
			return false;
		}

		if(event.ctrlKey && event.keyCode === 69){
			core.loadProgram();
			return false;
		}
	};


	var ctr = document.getElementById("container");
	document.onkeydown = checkKeys;
};