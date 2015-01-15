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
	codeEditor.loadCode("LINK -> R14, R2 -> ADDC.A, R2 -> ADDC.B\nR1 -> ADD.B, ADDC -> ADDC.A, ADDC -> ADDC.B\n#0x000F -> AND.A, R1 -> ADD.A\nADDC -> R5, ADD -> ADD.A, ADD -> ADD.B\nR5 -> ADDC.A, ADD -> ADD.A, ADD -> ADD.B\nR5 -> ADDC.B, ADD -> ADD.A, ADD -> ADD.B\nADDC -> R5, ADD -> ADD.A, ADD -> ADD.B\nR5 -> ADDC.A, ADD -> ADD.A, ADD -> ADD.B\nR5 -> ADDC.B, ADD -> ADD.A, ADD -> ADD.B\nR0 -> SH, ADD -> ADD.A, ADD -> ADD.B\nSH.R => ADD.B, ADD -> ADD.A, ADDC -> R5\nNC? #0x00F0 -> AND.A, ADD -> ADDR\nNC? R5 -> R2, DATA -> AND.B\nR14 -> IP, AND -> DATA, R2 -> DATA");

	var zeroFill  = function( number, width )
	{
		width -= number.toString().length;
		if ( width > 0 ) return new Array(width + (/\./.test(number) ? 2 : 1) ).join( '0' ) + number;
		return number;
	};

	var toDec = function(hexNumber) {
        return parseInt(hexNumber,16);
	};

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
		var _core 			= this,
			flagsData 		= [],
			destinationData = [],
			sourseData		= [],
			labels 		    = {},
			offset 			= 0x6800,
			commandCounter 	= 0;

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
			var _src  = "",
				_dst  = "",
				_cdtn = "",
				_c10  = false,
				_c16  = false,
				_sf   = false,
				_slots = [],
				_const = "-",
				_priority = -1;

				var getSlotCandidats = function(s,d){
					if(_sf === false && _cdtn === "" && getSRC_ADDR(0,s) > -1 && getDST_ADDR(0,d) > -1)
						_slots.push(0);

					if(getSRC_ADDR(1,s) > -1 && getDST_ADDR(1,d) > -1)
						_slots.push(1);

					if(getSRC_ADDR(2,s) > -1 && getDST_ADDR(2,d) > -1)
						_slots.push(2);
				}

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
				if(command.indexOf(': ') > -1) 
				{
					var labelPos = command.indexOf(': ');
					var label    = command.substring(0, labelPos + 1);
					var labelName = command.substring(0, labelPos);
					command = command.replace(label,'').trim();
					labels[labelName] = offset + commandCounter;
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
					errorCanvas.drawError('Console 12pt', 'ERROR: -> or => not found...', 5, 30, '#000');
					codeEditor.selectErrorLine();
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
						_src = parseInt(_src);

					(_src > 0x3FF) ? _c16 = true : _c10 = true;				
				}
			//############-Const10/16-#################################

			//4. ############-Find slot candidats-########################
				if(!_c16 && !_c10)
					getSlotCandidats(_src,_dst);
				else{
					_const = _src;
					(_src > 0x3FF) ? _src = 'CONST16' : _src = 'CONST10';
					getSlotCandidats(_src,_dst);
				}

				_priority = _slots.length;
			//############-Find slot candidats-########################
	
			if(_sf)
				_cdtn = 'SF';
			return {src:_src, dst:_dst, cdtn:_cdtn, const10:_c10, const16:_c16, sf:_sf, candidats:_slots, const10_16:_const, priority:_priority}
		};

		var parseBundle = function(bundle){
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

			binBundle.innerHTML = sr2 + sr1 + sr0;
			hexBundle.innerHTML = toHex2(sr2 + sr1 + sr0).result;
		};

		var getBundleSlots = function(bundle){
			var commands = parseBundle(bundle);
			var slots = [null,null,null];
			var parsedCommands = [];

			for(var i = 0; i < commands.length; i++)
				parsedCommands.push(parseCommand(commands[i]));

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
								var c = get16bitFromConst(cmd.const10_16);
								slots[0] = {const16:c.substring(6,16)};
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
									slots[0] = {src:cmd.src, dst:cmd.dst, cdtn:cmd.cdtn, sf:cmd.sf};
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
					slots[0] = {src:'R0', dst:'NULL'};	
				else if(slots[0].const10 === undefined && slots[0].const16 === undefined){
					if(slots[0].src === undefined && slots[0].dst === undefined)
						slots[0] = {src:'R0', dst:'NULL'};	
				}

				if(slots[1] === null)
					slots[1] = {src:'R0', dst:'NULL', cdtn:'', sf:false};	
				else if(slots[1].src === undefined && slots[1].dst === undefined){
					if(slots[1].cdtn === undefined)
						slots[1] = {src:'R0', dst:'NULL', cdtn:'', sf:false};	
					else
						slots[1] = {src:'R0', dst:'NULL', cdtn:slots[1].cdtn, sf:false};
				}
				
				if(slots[2] === null)
					slots[2] = {src:'R0', dst:'NULL',cdtn:'', sf:false};	
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
			var row = document.createElement('tr');
			var val = document.createElement('td');
			var flg = document.createElement('td');
			flg.innerHTML = "Flag";	
			flg.className = 'regCol';	
			val.innerHTML = "Value";
			val.className = 'regCol';

				row.appendChild(flg);
				row.appendChild(val);
				flgTable.appendChild(row);

			for(var i = 2; i < flags.length; i++){
				var row = document.createElement('tr');
				row.setAttribute("id", "flg" + c);

				var flg = document.createElement('td');
				flg.className = 'regCol';

				var val = document.createElement('td');
				flg.innerHTML = flags[i];		
				val.innerHTML = toHex(0);

				row.appendChild(flg);
				row.appendChild(val);
				flgTable.appendChild(row);
				c++;
			}

			c = 0;
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

		_core.run = function(){
			for(var i = 0; i < codeEditor.getLinesCount(); i++)
				_core.step();
		};

		_core.step = function(){
			errorCanvas.clearColor('#cfc');
			var s = codeEditor.step();
			//currentCommand.innerHTML = s;
			var slots = getBundleSlots(s);
			drawSlots(slots);
			_core.refresh();
			commandCounter++;
		};

		_core.runCommand = function(command){
			var parsed = parseCommand(command);
			if(!parsed.const10 && !parsed.const16) //const
			   destinationData[parsed.dst] = sourseData[getSRC_ADDR(parsed.src)];
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

			commandCounter = 0;
			//labels = {};

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