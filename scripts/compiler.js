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
	var binBundle = document.getElementById('binaryBundle');
	var hexBundle = document.getElementById('hexBundle');

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

	errorCanvas.clearCanvas('#fcc');
	errorCanvas.drawText('Console 12pt', 'ERROR', 5, 10, '#000');

	codeEditor.refresh();
	codeEditor.loadCode("LINK -> R14, R2 -> ADDC.A, R2 -> ADDC.B\nR1 -> ADD.B, ADDC -> ADDC.A, ADDC -> ADDC.B\n#0x000F -> AND.A, R1 -> ADD.A\nADDC -> R5, ADD -> ADD.A, ADD -> ADD.B\nR5 -> ADDC.A, ADD -> ADD.A, ADD -> ADD.B\nR5 -> ADDC.B, ADD -> ADD.A, ADD -> ADD.B\nADDC -> R5, ADD -> ADD.A, ADD -> ADD.B\nR5 -> ADDC.A, ADD -> ADD.A, ADD -> ADD.B\nR5 -> ADDC.B, ADD -> ADD.A, ADD -> ADD.B\nR0 -> SH, ADD -> ADD.A, ADD -> ADD.B\nSH.R => ADD.B, ADD -> ADD.A, ADDC -> R5\nNC? #0x00F0 -> AND.A, ADD -> ADDR\nNC? R5 -> R2, DATA -> AND.B\nR14 -> IP, AND -> DATA, R2 -> DATA\n");

	var zeroFill  = function( number, width )
	{
		width -= number.toString().length;
		if ( width > 0 ) return new Array(width + (/\./.test(number) ? 2 : 1) ).join( '0' ) + number;
		return number;
	};

	var toDec = function(hexNumber) {
        return parseInt(hexNumber,16);
	};

	function toBin(decValue){
		if(decValue >= 0)
			return decValue.toString(2);
		else 
	        return (~decValue).toString(2);
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

	var destroyChildren = function(node)
	{
		while (node.firstChild)
			node.removeChild(node.firstChild);
	};

	var t = function(){

	};

	var createHeaders = function(){
		var row = document.createElement('tr');
		var reg = document.createElement('td');
		reg.className = 'regCol';
		var val = document.createElement('td');
		val.className = 'regCol';
		reg.innerHTML = 'REG(dst)';
		val.innerHTML = 'value';

		var addr = document.createElement('td');
		addr.innerHTML = 'Address';
		addr.className = 'regCol';
		row.appendChild(addr);
		row.appendChild(reg);
		row.appendChild(val);
		dstTable.appendChild(row);

		row = document.createElement('tr');
		reg = document.createElement('td');
		reg.className = 'regCol';
		val = document.createElement('td');
		val.className = 'regCol';
		reg.innerHTML = 'REG(src)';		
		val.innerHTML = 'value';

		var addr = document.createElement('td');
		addr.innerHTML = 'Address';
		addr.className = 'regCol';

		row.appendChild(addr);
		row.appendChild(reg);
		row.appendChild(val);
		srcTable.appendChild(row);
	};

	var Core = function(){
		var _core 			= this;
		var flags 			= {};
		var destinationData = [];
		var sourseData		= [];

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


		for(var i = 0; i < 32; i++)
		{
			destinationData[i] = 0;
			sourseData[i] = 0;
		}

		flags.C = 0;
		flags.Z = 0;
		flags.S = 0;
		flags.E = 0;

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
		}

		var checkFlags = function(value){
			(value > 0x8000) ? flags.S = 1 : flags.S = 0;
			(value === 0)    ? flags.Z = 1 : flags.Z = 0;
			(value > 0xFFFF) ? flags.C = 1 : flags.C = 0;
		};

		var parseCommand = function(command){

			//Example: 	#10->R1
			//			#0x80->R1	
			//			Z? #200->R1
			//			C? #200->R1
			//			S? #200->R1

			var _src  = "";
			var _dst  = "";
			var _cdtn = "";
			var _c10 = false;
			var _c16 = false;
			var _sf  = false;

			//############-condition-##################################
				if(command.indexOf('?') > -1) 
				{
					if(command.indexOf('NZ?') > -1){
						command = command.replace("NZ?","").trim();
						_cdtn = 'NZ?';
					}

					else if(command.indexOf('Z?') > -1){
						command = command.replace("Z?","").trim();
						_cdtn = 'Z?';
					}

					else if(command.indexOf('C?') > -1 && command.indexOf('NC?') === -1){
						command = command.replace("C?","").trim();
						_cdtn = 'C?';
					}

					else if(command.indexOf('NC?') > -1){
						command = command.replace("NC?","").trim();
						_cdtn = 'NC?';
					}

					else if(command.indexOf('S?') > -1){
						command = command.replace("S?","").trim();
						_cdtn = 'S?';
					}

					else if(command.indexOf('E?') > -1){
						command = command.replace("E?","").trim();
						_cdtn = 'E?';
					}
				}
			//############-condition-##################################

			//############-SRC-DST-####################################
				if(command.indexOf('->') > -1) {
					var srcdst = command.split('->');
					_src = srcdst[0].trim();
					_dst = srcdst[1].trim();
				}

				if(command.indexOf('=>') > -1) {
					var srcdst = command.split('=>');
					_src = srcdst[0].trim();
					_dst = srcdst[1].trim();
					_sf  = true;
				}
			//############-SRC-DST-####################################

			//############-Const10/16-#################################
				if(_src.indexOf('#') > -1){
					_src = _src.replace('#','').trim();

					if(_src.indexOf('0x') > -1){
						_src = _src.replace('0x','').trim();
						_src = toDec(_src);
					}
					else
						_src = parseInt(_src);

					(_src > 0x3FF) ? _c16 = true : _c10 = true;				
				}
			//############-Const10/16-#################################

			return {src:_src, dst:_dst, cdtn:_cdtn, const10:_c10, const16:_c16, sf:_sf}
		};

		var parseBundle = function(bundle){
			var commands = bundle.split(',');
			for(var i = 0; i < commands.length; i++)
				commands[i] = commands[i].trim();
			return commands;
		};

		var get10bitFromConst = function(value){
			var bin = toBin(value);
			var dt = 16 - bin.length;
			var n = '';
			for(var i = 0; i < dt; i++)
				n += '0';
			bin = n + bin;
			return bin.substring(6,16);
		};

		var get5bitFromConst = function(value){
			var bin = toBin(value);
			var dt = 5 - bin.length;
			var n = '';
			for(var i = 0; i < dt; i++)
				n += '0';
			bin = n + bin;
			return bin;
		};

		var get16bitFromConst = function(value){
			var bin = toBin(value);
			var dt = 16 - bin.length;
			var n = '';
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
				default:
					bits = value;
					break;
			}

			return bits;
		}

		var drawSlots = function(slots){

			if(slots[0] !== null)
			{
				if(slots[0].const10 !== undefined){
					SlotsTable.values.slot0src.innerHTML = slots[0].const10.substring(5,10);
					SlotsTable.values.slot0dst.innerHTML = slots[0].const10.substring(0,5);
					SlotsTable.exp.slot0src.innerHTML = "c10 5bit (l)";
					SlotsTable.exp.slot0dst.innerHTML = "c10 5bit (h)";
				}
				else if(slots[0].const16 !== undefined){
					SlotsTable.values.slot0src.innerHTML = slots[0].const16.substring(5,10);
					SlotsTable.values.slot0dst.innerHTML = slots[0].const16.substring(0,5);
					SlotsTable.exp.slot0src.innerHTML = "c16 5bit (l)";
					SlotsTable.exp.slot0dst.innerHTML = "c16 5bit (h)";
				}
				else
				{
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
			}

			if(slots[2] != null)
			{
				SlotsTable.values.slot2src.innerHTML = getSRC_ADDR(2, slots[2].src);
				SlotsTable.values.slot2dst.innerHTML = getDST_ADDR(2, slots[2].dst);
				SlotsTable.exp.slot2src.innerHTML = slots[2].src;
				SlotsTable.exp.slot2dst.innerHTML = slots[2].dst;
				SlotsTable.values.slot2cdtn.innerHTML = getFlagBits(slots[2].cdtn);
			}

			if(slots[0].const16 === undefined){

				if(slots[2].cdtn === '')
				   SlotsTable.exp.slot2cdtn.innerHTML = '-';
				else
				   SlotsTable.exp.slot2cdtn.innerHTML = slots[2].cdtn;

				if(slots[1].cdtn === '')
					SlotsTable.exp.slot1cdtn.innerHTML = '-';
				else
					SlotsTable.exp.slot1cdtn.innerHTML = slots[1].cdtn;
			}
			else
			{
				SlotsTable.exp.slot2cdtn.innerHTML = 'C16 3bit';
				SlotsTable.exp.slot1cdtn.innerHTML = 'C16 3bit';
			}

			var ss0 = 0;
			var sd0 = 0;

			var ss1 = 0;
			var sd1 = 0;
			var sc1 = '000';

			var ss2 = 0;
			var sd2 = 0;
			var sc2 = '000';

			if(slots[0].src !== undefined && slots[0].dst !== undefined)
			{
				ss0 = get5bitFromConst(getSRC_ADDR(0,slots[0].src));
				sd0 = get5bitFromConst(getDST_ADDR(0,slots[0].dst));
			}
			else if(slots[0].const16 !== undefined)
				ss0 = slots[0].const16;

			else if (slots[0].const10 !== undefined)
				ss0 = slots[0].const10;

			if(slots[1].src !== undefined && slots[1].dst !== undefined)
			{
				ss1 = get5bitFromConst(getSRC_ADDR(1,slots[1].src));
				sd1 = get5bitFromConst(getDST_ADDR(1,slots[1].dst));

				if(slots[1].cdtn !== '')
					sc1 = getFlagBits(slots[1].cdtn);
			}

			if(slots[2].src !== undefined && slots[2].dst !== undefined)
			{
				ss2 = get5bitFromConst(getSRC_ADDR(2,slots[2].src));
				sd2 = get5bitFromConst(getDST_ADDR(2,slots[2].dst));
				if(slots[2].cdtn !== '')
					sc2 = getFlagBits(slots[2].cdtn);
			}

			var sr0 = sd0 + ss0;
			var sr1 = sc1 + sd1 + ss1;
			var sr2 = sc2 + sd2 + ss2;

			binBundle.innerHTML = sr2 + sr1 + sr0;
			hexBundle.innerHTML = toHex2(sr2 + sr1 + sr0).result;
		};

		var getBundleSlots = function(bundle){
			var commands = parseBundle(bundle);
			var slots = [];
			var parsedCommands = [];

			/*if(commands.length < 3){
				for (var i = commands.length; i < 3; i++)
					commands.push("R1->NULL");
			}*/

			for(var i = 0; i < commands.length; i++)
				parsedCommands.push(parseCommand(commands[i]));

			//############-Create slots-#################################

				var slot0 = null;
				var slot1 = null;
				var slot2 = null;

				var const16E = false;
				var const10E = false;

				var const16A = null;
				var const10A = null;

				for(var i = 0; i < parsedCommands.length; i++){
					var cmd = parsedCommands[i];
					if(cmd.const10) const10A  = parsedCommands[i];
					if(cmd.const16) const16A  = parsedCommands[i];
				}

				if(const10A !== null){
					var idx = parsedCommands.indexOf(const10A);
					parsedCommands.splice(idx, 1);
				}

				if(const16A !== null){
					var idx = parsedCommands.indexOf(const16A);
					parsedCommands.splice(idx, 1);
				}

				if(const10A !== null)
				{
					var s = get16bitFromConst(const10A.src);
					slot0 = {const10:s.substring(6,16)};

					if(parsedCommands.length === 1){
						if(getDST_ADDR(1, parsedCommands[0].dst) > -1 && getSRC_ADDR(1, parsedCommands[0].src) > -1){
							if(getDST_ADDR(2, const10A.dst) > -1){	
								slot2 = {};		
								slot2.src = "CONST10";
								slot2.dst  = const10A.dst;
								slot2.cdtn = const10A.cdtn;
							}	
						}
						else if(getDST_ADDR(2, parsedCommands[0].dst) > -1 && getSRC_ADDR(2, parsedCommands[0].src) > -1){
								if(getDST_ADDR(1, const10A.dst) > -1){	
								slot1 = {};
								slot1.src = "CONST10";
								slot1.dst  = const10A.dst;
								slot1.cdtn = const10A.cdtn;
							}
						}
					}
					else{					
						slot1 = {src:"CONST10", dst:const10A.dst, cdtn:const10A.cdtn};

						if(getDST_ADDR(1, const10A.dst) > -1){	
							slot1 = {};
							slot1.src = "CONST10";
							slot1.dst  = const10A.dst;
							slot1.cdtn = const10A.cdtn;
						}
						else if(getDST_ADDR(2, const10A.dst) > -1){	
							slot2 = {};		
							slot2.src = "CONST10";
							slot2.dst  = const10A.dst;
							slot2.cdtn = const10A.cdtn;
						}	
					}
				}
				else if(const16A !== null){
					var s = get16bitFromConst(const16A.src);
					slot0 = {const16:s.substring(6,16)};
					slot1 = {};
					slot2 = {};

					if(getDST_ADDR(1, const16A.dst) > -1){	
						slot1.src = "CONST16";
						slot1.dst = const16A.dst;
					}
					else if(getDST_ADDR(2, const16A.dst) > -1){			
						slot2.src = "CONST16";
						slot2.dst = const16A.dst;
					}

					slot1.cdtn = s.substring(3,6);
					slot2.cdtn = s.substring(0,3);
				}

				if(const10A !== null || const16A !== null)
				{
					//Если есть константа и запись вида: #100->R1, R2->R3, R4->R5, т.е. осталась лишняя команда
					if(parsedCommands.length > 1)
						errorCanvas.drawText('Console 12pt', 'ERROR: const defined only 1 commands avaliable...', 5, 20, '#000');
				}

				if(const10A === null && const16A === null)
				{	
					var _candidats = [];
					for(var i = 0; i < parsedCommands.length; i++){
						var cmd = parsedCommands[i];
						var candidats = [];

						if(cmd.cdtn === '' && getSRC_ADDR(0, cmd.src) > -1 && getDST_ADDR(0, cmd.dst) > -1)
							candidats.push('slot0');

						if(getSRC_ADDR(1, cmd.src) > -1 && getDST_ADDR(1, cmd.dst) > -1)
							candidats.push('slot1');

						if(getSRC_ADDR(2, cmd.src) > -1 && getDST_ADDR(2, cmd.dst) > -1)
							candidats.push('slot2');

						_candidats.push({cmd:parsedCommands[i], cdt:candidats});
					}

					var high   = [];
					var midlle = [];
					var low    = [];

					for(var i = 0; i < _candidats.length; i++)
					{
						var cdt = _candidats[i].cdt;
						if(cdt.length === 3)
							low.push(_candidats[i]); 
						else if(cdt.length === 2)
							midlle.push(_candidats[i]); 
						else if(cdt.length === 1)
							high.push(_candidats[i]); 
					}

					for(var i = 0; i < high.length; i++)
					{
						var cmd = high[i].cmd;

						for(var j = 0; j < high[i].cdt.length; j++)
						{
							var cdt = high[i].cdt[j];

							if(cdt == 'slot0')
							{
								if(slot0 === null){
									slot0 = {src:cmd.src, dst:cmd.dst};
									break;
								}
								else
									continue;
							}

							else if(cdt == 'slot1')
							{
								if(slot1 === null){
									slot1 = {src:cmd.src, dst:cmd.dst, cdtn:cmd.cdtn}
									break;
								}
								else
									continue;
							}

							else if(cdt == 'slot2')
							{
								if(slot2 === null){
									slot2 = {src:cmd.src, dst:cmd.dst, cdtn:cmd.cdtn}
									break;
								}
								else
									continue;
							}
						}
					}

					for(var i = 0; i < midlle.length; i++)
					{
						var cmd = midlle[i].cmd;

						for(var j = 0; j < midlle[i].cdt.length; j++)
						{
							var cdt = midlle[i].cdt[j];

							if(cdt == 'slot0')
							{
								if(slot0 === null){
									slot0 = {src:cmd.src, dst:cmd.dst};
									break;
								}
								else
									continue;
							}

							else if(cdt == 'slot1')
							{
								if(slot1 === null){
									slot1 = {src:cmd.src, dst:cmd.dst, cdtn:cmd.cdtn}
									break;
								}
								else
									continue;
							}

							else if(cdt == 'slot2')
							{
								if(slot2 === null){
									slot2 = {src:cmd.src, dst:cmd.dst, cdtn:cmd.cdtn}
									break;
								}
								else
									continue;
							}
						}
					}

					for(var i = 0; i < low.length; i++)
					{
						var cmd = low[i].cmd;

						for(var j = 0; j < low[i].cdt.length; j++)
						{
							var cdt = low[i].cdt[j];

							if(cdt == 'slot0')
							{
								if(slot0 === null){
									slot0 = {src:cmd.src, dst:cmd.dst};
									break;
								}
								else
									continue;
							}

							else if(cdt == 'slot1')
							{
								if(slot1 === null){
									slot1 = {src:cmd.src, dst:cmd.dst, cdtn:cmd.cdtn}
									break;
								}
								else
									continue;
							}

							else if(cdt == 'slot2')
							{
								if(slot2 === null){
									slot2 = {src:cmd.src, dst:cmd.dst, cdtn:cmd.cdtn}
									break;
								}
								else
									continue;
							}
						}
					}

						/*if(slot0 === null && getSRC_ADDR(0, cmd.src) > -1 && getDST_ADDR(0, cmd.dst) > -1 && cmd.cdtn === '')
							slot0 = {src:cmd.src, dst:cmd.dst};
						else if(slot1 === null && getSRC_ADDR(1, cmd.src) > -1 && getDST_ADDR(1, cmd.dst) > -1)
							slot1 = {src:cmd.src, dst:cmd.dst, cdtn:cmd.cdtn}
						else if(slot2 === null && getSRC_ADDR(2, cmd.src) > -1 && getDST_ADDR(2, cmd.dst) > -1)
							slot2 = {src:cmd.src, dst:cmd.dst, cdtn:cmd.cdtn}
						else
							errorCanvas.drawText('Console 12pt', 'ERROR: all slots full.', 5, 20, '#000');		*/	
				}
				else
				{
					if(const10A)
					{
						for(var i = 0; i < parsedCommands.length; i++){
							var cmd = parsedCommands[i];
							if(slot2 === null)
								slot2 = {src:cmd.src, dst:cmd.dst, cdtn:cmd.cdtn}	
							else if(slot1=== null)
								slot1 = {src:cmd.src, dst:cmd.dst, cdtn:cmd.cdtn}	
						}
					}
					else if(const16A)
					{
						for(var i = 0; i < parsedCommands.length; i++){
							var cmd = parsedCommands[i];
							if(cmd.cdtn !== '')
								errorCanvas.drawText('Console 12pt', 'ERROR: CONST16 defined condition bits disabled...', 5, 20, '#000');	
							else
							{
								if(slot1.src === undefined && slot1.dst === undefined)
								   slot1 = {src:cmd.src, dst:cmd.dst, cdtn:slot1.cdtn};
								else if(slot2.src === undefined && slot2.dst === undefined)
								   slot2 = {src:cmd.src, dst:cmd.dst, cdtn:slot2.cdtn};
							}
						}
					}
				}

			if(slot1 === null || (slot1.src === undefined && slot1.dst === undefined))
				slot1 = {src:'R0', dst:'NULL', cdtn:''};

			if(slot2 === null || (slot2.src === undefined && slot2.dst === undefined))
				slot2 = {src:'R0', dst:'NULL', cdtn:''};	

			slots[0] = slot0;
			slots[1] = slot1;
			slots[2] = slot2;

			return slots;
		};

		//############-Create slots-#################################

		_core.drawRegisters = function(){
			destroyChildren(srcTable);
			destroyChildren(dstTable);
			destroyChildren(flgTable);

			var c = 0;

			createHeaders();

			/*for(var p in destination){
				var row = document.createElement('tr');
				row.setAttribute("id", "dst" + c);

				var addr = document.createElement('td');
				addr.innerHTML = toHex(c);

				var reg = document.createElement('td');
				reg.className = 'regCol';

				var val = document.createElement('td');
				reg.innerHTML = p;		
				val.innerHTML = toHex(destinationData[destination[p]]);
				row.appendChild(addr);
				row.appendChild(reg);
				row.appendChild(val);
				dstTable.appendChild(row);
				c++;
			}*/

			/*c = 0;
			for(var p in sourses){
				if(c > 16 && c < 22)
				{
					var addr = document.createElement('td');
					addr.innerHTML = toHex(c);

					var row = document.createElement('tr');
					row.setAttribute("id", "src" + c);

					var reg = document.createElement('td');
					reg.className = 'regCol';

					var val = document.createElement('td');
					reg.innerHTML = p;		
					val.innerHTML = toHex(sourseData[sourses[p]]);
					row.appendChild(addr);
					row.appendChild(reg);
					row.appendChild(val);
					srcTable.appendChild(row);				
				}
				c++;
			}*/

			c = 0;
			for(var p in flags){
				var row = document.createElement('tr');
				row.setAttribute("id", "flg" + c);

				var flg = document.createElement('td');
				flg.className = 'regCol';

				var val = document.createElement('td');
				flg.innerHTML = p;		
				val.innerHTML = toHex(flags[p]);

				row.appendChild(flg);
				row.appendChild(val);
				flgTable.appendChild(row);
				c++;
			}
		};

		_core.selectRow = function(prefix, num){
			var id = prefix + num;
			var row = document.getElementById(id);
			//row.style.backgroundColor = "#cfc";
		};

		_core.update = function(){
			sourseData[getSRC_ADDR("ADD")]  = destinationData[getSRC_ADDR("ADD.A")]  + destinationData[getSRC_ADDR("ADD.B")];
			sourseData[getSRC_ADDR("ADDC")] = destinationData[getSRC_ADDR("ADDC.A")] + destinationData[getSRC_ADDR("ADDC.A")] + flags.C;
			sourseData[getSRC_ADDR("SUB")]  = destinationData[getSRC_ADDR("SUB.B")]  - destinationData[getSRC_ADDR("SUB.A")];
			sourseData[getSRC_ADDR("XOR")]  = destinationData[getSRC_ADDR("XOR.B")]  ^ destinationData[getSRC_ADDR("XOR.A")];
			//hardRegisters[i] = hardRegisters[i] % 0x10000
		};

		_core.refresh = function(){
			//executeSlots(slots);
			core.update();
			core.drawRegisters();
		};

		_core.step = function(){
			errorCanvas.clearColor('#fcc');
			var s = codeEditor.step();
			//currentCommand.innerHTML = s;
			var slots = getBundleSlots(s);
			drawSlots(slots);
			_core.refresh();
		};

		_core.runCommand = function(command){
			var parsed = parseCommand(command);
			if(!parsed.const10 && !parsed.const16) //const
			   destinationData[parsed.dst] = sourseData[getSRC_ADDR(parsed.src)];
		};

		_core.reset = function(){

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
	
			for(var i = 0; i < 32; i++)
			{
				destinationData[i] = 0;
				sourseData[i] 	   = 0;
			}
			codeEditor.reset();
		};
	};

	_compiler.getCore = function(){
		return core;
	};

	var core = new Core();	
	core.refresh();
	core.selectRow('src', 18);
	core.selectRow('dst', 7);
	core.selectRow('flg', 2);
};