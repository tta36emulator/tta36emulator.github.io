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
	codeEditor.loadCode("R1->R2\nR1->R2, R3->R4, R5->R6\nZ? R1->R2, R3->R4, R5->R6\nZ? R1->R2, NZ? R3->R4, R5->R6\n#10->R7\n#10->R7,R10->R11");

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

	var destroyChildren = function(node)
	{
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
		var _core 			= this;
		var sourses 		= {};
		var destination 	= {};
		var flags 			= {};
		var destinationData = [];
		var sourseData		= [];

		for(var i = 0; i < 32; i++)
		{
			destinationData[i] = 0;
			sourseData[i] = 0;
		}

		flags.C = 0;
		flags.Z = 0;
		flags.S = 0;
		flags.E = 0;

		sourses.R0  	= 0;
		sourses.R1  	= 1;
		sourses.R2  	= 2;
		sourses.R3  	= 3;
		sourses.R4  	= 4;
		sourses.R5  	= 5;
		sourses.R6  	= 6;
		sourses.R7  	= 7;
		sourses.R8  	= 8;
		sourses.R9  	= 9;
		sourses.R10 	= 10;
		sourses.R11 	= 11;
		sourses.R12 	= 12;
		sourses.R13 	= 13;
		sourses.R14 	= 14;
		sourses.IP 		= 15;
		sourses.LINK  	= 16;
		sourses.ADD 	= 17;
		sourses.ADDC 	= 18;
		sourses.SUB 	= 19;
		sourses.XOR 	= 20;
		sourses.AND 	= 21;
		sourses.STATE 	= 22;
		sourses['SH.R'] = 23;
		sourses.PIN 	= 24;
		sourses.CONST10 = 25;
		sourses.CONST16 = 26;

		destination.R0  	= 0;
		destination.R1  	= 1;
		destination.R2  	= 2;
		destination.R3 	 	= 3;
		destination.R4  	= 4;
		destination.R5  	= 5;
		destination.R6  	= 6;
		destination.R7  	= 7;
		destination.R8  	= 8;
		destination.R9  	= 9;
		destination.R10 	= 10;
		destination.R11 	= 11;
		destination.R12 	= 12;
		destination.R13	 	= 13;
		destination.R14 	= 14;
		destination.IP  	= 15;
		destination.ADDR 	= 16;
		destination.DATA 	= 17;
		destination["ADD.A"] 	= 18;
		destination["ADD.B"] 	= 19;
		destination["AND.A"] 	= 20;
		destination["AND.B"] 	= 21;
		destination["SUB.A"]	= 22;
		destination["SUB.B"] 	= 23;
		destination.SH 			= 24;
		destination["ADDC.A"] 	= 25;
		destination["ADDC.B"] 	= 26;
		destination["XOR.A"] 	= 27;
		destination["XOR.B"] 	= 28;
		destination.STATE 		= 29;
		destination.POUT 		= 30;
		destination.NULL 		= 31;

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

					else if(command.indexOf('C?') > -1){
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

			return {src:_src, dst:_dst, cdtn:_cdtn, const10:_c10, const16: _c16}
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
					SlotsTable.exp.slot0src.innerHTML = "const10 5bit (low)";
					SlotsTable.exp.slot0dst.innerHTML = "const10 5bit (high)";
				}
				else if(slots[0].const16 !== undefined){
					SlotsTable.values.slot0src.innerHTML = slots[0].const16.substring(5,10);
					SlotsTable.values.slot0dst.innerHTML = slots[0].const16.substring(0,5);
					SlotsTable.exp.slot0src.innerHTML = "const16 5bit (low)";
					SlotsTable.exp.slot0dst.innerHTML = "const16 5bit (high)";
				}
				else
				{
					SlotsTable.values.slot0src.innerHTML = sourses[slots[0].src];
					SlotsTable.values.slot0dst.innerHTML = destination[slots[0].dst];
					SlotsTable.exp.slot0src.innerHTML = slots[0].src;
					SlotsTable.exp.slot0dst.innerHTML = slots[0].dst;
				}
			}

			if(slots[1] != null)
			{
				SlotsTable.values.slot1src.innerHTML = sourses[slots[1].src];
				SlotsTable.values.slot1dst.innerHTML = destination[slots[1].dst];
				SlotsTable.exp.slot1src.innerHTML = slots[1].src;
				SlotsTable.exp.slot1dst.innerHTML = slots[1].dst;
				SlotsTable.values.slot1cdtn.innerHTML = getFlagBits(slots[1].cdtn);
			}

			if(slots[2] != null)
			{
				SlotsTable.values.slot2src.innerHTML = sourses[slots[2].src];
				SlotsTable.values.slot2dst.innerHTML = destination[slots[2].dst];
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
					slot0 = {const10:get10bitFromConst(const10A.src)};
					slot1 = {src:"CONST10", dst:const10A.dst, cdtn:const10A.cdtn};
				}

				if(const16A !== null)
				{
					slot0 = {const10:get10bitFromConst(CONST16A.src)};
					slot1 = {src:"CONST16", dst:const16A.dst, cdtn:get3bitFromConst(CONST16A.src)};
					slot2 = {cdtn:get3bitFromConst(CONST16A.src)};
				}

				if(const10A !== null || const16A !== null)
				{
					if(parsedCommands.length > 1)
						errorCanvas.drawText('Console 12pt', 'ERROR: const defined only 1 commands avaliable...', 5, 20, '#000');
				}

				if(const10A === null && const16A === null)
				{	
					for(var i = 0; i < parsedCommands.length; i++){
						var cmd = parsedCommands[i];

						if(cmd.cdtn === '' && slot0 === null) 
							slot0 = {src:cmd.src, dst:cmd.dst}
						else if(slot1 === null)
							slot1 = {src:cmd.src, dst:cmd.dst, cdtn:cmd.cdtn}
						else if(slot2 === null)
							slot2 = {src:cmd.src, dst:cmd.dst, cdtn:cmd.cdtn}
						else
							errorCanvas.drawText('Console 12pt', 'ERROR: all slots full.', 5, 20, '#000');				
					}
				}
				else
				{
					if(const10A)
					{
						for(var i = 0; i < parsedCommands.length; i++){
							var cmd = parsedCommands[i];
							if(slot2 === null)
								slot2 = {src:cmd.src, dst:cmd.dst, cdtn:cmd.cdtn}	
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
								if(slot2.src === undefined && slot2.dst === undefined)
								   slot2 = {src:cmd.src, dst:cmd.dst}
							}
						}
					}
				}

			if(slot1 === null)
				slot1 = {src:'R0', dst:'NULL', cdtn:''};

			if(slot2 === null)
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

			for(var p in destination){
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
			}

			c = 0;
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
			}

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
			row.style.backgroundColor = "#cfc";
		};

		_core.update = function(){
			sourseData[sourses.ADD]  = destinationData[destination["ADD.A"]]  + destinationData[destination["ADD.B"]];
			sourseData[sourses.ADDC] = destinationData[destination["ADDC.A"]] + destinationData[destination["ADDC.B"]] + flags.C;
			sourseData[sourses.SUB]  = destinationData[destination["SUB.B"]]  - destinationData[destination["SUB.A"]];
			sourseData[sourses.XOR]  = destinationData[destination["XOR.B"]]  ^ destinationData[destination["XOR.A"]];
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
			currentCommand.innerHTML = s;
			var slots = getBundleSlots(s);
			drawSlots(slots);
			_core.refresh();
		};

		_core.runCommand = function(command){
			var parsed = parseCommand(command);

			if(parsed.const10 || parsed.const16) //const
			   destination[parsed.dst] = parsed.src;
			else //source register
			   destination[parsed.dst] = sourses[parsed.src];
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