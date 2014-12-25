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
	var xcanvas = new Xcanvas(bg_context, screen);

	var dstTable  = document.getElementById('dstTable');
	var srcTable  = document.getElementById('srcTable');
	var flgTable  = document.getElementById('flgTable');
	
	var currentCommand = document.getElementById('currentCommand');

	var temp = {
		slot0:{src:0,dst:0},
		slot1:{src:0,dst:0},
		slot2:{src:0,dst:0},
	};

	xcanvas.clearCanvas('#ccf');
	xcanvas.drawText('Console 12pt', 'SCREEN', 5, 10, '#000');

	codeEditor.refresh();
	codeEditor.loadCode("#10 -> ADD.A\n#10 -> ADD.B\nADD -> R1\n#10 -> ADD.A\n#10 -> ADD.B\nADD -> R1\n#10 -> ADD.A\n#10 -> ADD.B\nADD -> R1\n#10 -> ADD.A\n#10 -> ADD.B\nADD -> R1\n#10 -> ADD.A\n#10 -> ADD.B\nADD -> R1");

	var zeroFill  = function( number, width )
	{
		width -= number.toString().length;
		if ( width > 0 ) return new Array(width + (/\./.test(number) ? 2 : 1) ).join( '0' ) + number;
		return number;
	};

	var toDec = function(hexNumber) {
        return parseInt(hexNumber,16);
	};

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
		var _core 		= this;
		var sourses 	= {};
		var destination = {};
		var flags 		= {};

		flags.C = 0;
		flags.Z = 0;
		flags.S = 0;
		flags.E = 0;

		sourses.R0  	= 0;
		sourses.R1  	= 0;
		sourses.R2  	= 0;
		sourses.R3  	= 0;
		sourses.R4  	= 0;
		sourses.R5  	= 0;
		sourses.R6  	= 0;
		sourses.R7  	= 0;
		sourses.R8  	= 0;
		sourses.R9  	= 0;
		sourses.R10 	= 0;
		sourses.R11 	= 0;
		sourses.R12 	= 0;
		sourses.R13 	= 0;
		sourses.R14 	= 0;
		sourses.IP 		= 0;
		sourses.LINK  	= 0;
		sourses.ADD 	= 0;
		sourses.ADDC 	= 0;
		sourses.SUB 	= 0;
		sourses.XOR 	= 0;
		sourses.AND 	= 0;
		sourses.STATE 	= 0;
		sourses.PIN 	= 0;
		sourses.CONST10 = 0;
		sourses.CONST16 = 0;

		destination.R0  	= 0;
		destination.R1  	= 0;
		destination.R2  	= 0;
		destination.R3 	 	= 0;
		destination.R4  	= 0;
		destination.R5  	= 0;
		destination.R6  	= 0;
		destination.R7  	= 0;
		destination.R8  	= 0;
		destination.R9  	= 0;
		destination.R10 	= 0;
		destination.R11 	= 0;
		destination.R12 	= 0;
		destination.R13	 	= 0;
		destination.R14 	= 0;
		destination.IP  	= 0;
		destination.ADDR 	= 0;
		destination.DATA 	= 0;
		destination["ADD.A"] 	= 32000;
		destination["ADD.B"] 	= 1000;
		destination["AND.A"] 	= 0;
		destination["AND.B"] 	= 0;
		destination["SUB.A"]	= 0;
		destination["SUB.B"] 	= 0;
		destination.SH 			= 0;
		destination["ADDC.A"] 	= 0;
		destination["ADDC.B"] 	= 0;
		destination["XOR.A"] 	= 0;
		destination["XOR.B"] 	= 0;
		destination.STATE 		= 0;
		destination.POUT 		= 0;
		destination.NULL 		= 0;

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

		var getBundleSlots = function(bundle){
			var commands = parseBundle(bundle);
			var slots = [];
			var parsedCommands = [];

			if(commands.length < 3){
				for (var i = commands.length; i < 3; i++)
					commands.push("R1->NULL");
			}

			for(var i = 0; i < commands.length; i++)
				parsedCommands.push(parseCommand(commands[i]));

			//############-Create slots-#################################

				var slot0 = null;
				var slot1 = null;
				var slot2 = null;

				var const16E = false;
				var const10E = false;

				var const16A = -1;
				var const10A = -1;

				for(var i = 0; i < parsedCommands.length; i++){
					var cmd = parsedCommands[i];
					if(cmd.const10) const10A  = i;
					if(cmd.const16) const16A  = i;
				}

				parsedCommands.splice(const10A,1);
				parsedCommands.splice(const16A,1);

				if(const10A > -1)
				{
					var cmd = parsedCommands[const10A];
					slot0 = {const10:get10bitFromConst(cmd.src)};
					slot1 = {src: sourses.const10, dst:cmd.dst, cdtn:cmd.cdtn};
				}

				if(const16A > -1)
				{
					var cmd = parsedCommands[const16A];
					slot0 = {const10:get10bitFromConst(cmd.src)};
					slot1 = {cdtn:get3bitFromConst(cmd.src)};
					slot2 = {cdtn:get3bitFromConst(cmd.src)};
				}

				if(const10A === -1 && const16A === -1)
				{
					for(var i = 0; i < parsedCommands.length; i++){
						var cmd = parsedCommands[i];

						if(cmd.cdtn === '' && slot0 === null) 
							slot0 = {src:cmd.src, dst:cmd.dst}
						else if(slot1 === null)
							slot1 = {src:cmd.src, dst:cmd.dst, cdtn:cmd.cdtn}
						else if(slot2 === null)
							slot2 = {src:cmd.src, dst:cmd.dst, cdtn:cmd.cdtn}				
					}
				}
				else
				{
					if(const10A)
					{
						if(slot2 === null)
							slot2 = {src:cmd.src, dst:cmd.dst, cdtn:cmd.cdtn}	
					}
					else if(const16A)
					{
						if(cmd.cdtn !== '')
							console.log('ERROR: CONST16 defined condition bits disabled...');
						else
						{
							if(slot1.src === undefined && slot1.dst === undefined)
								slot1 = {src:cmd.src, dst:cmd.dst}
							else if(slot2.src === undefined && slot2.dst === undefined)
								slot2 = {src:cmd.src, dst:cmd.dst}
						}
					}
				}	
			return slots;
		};

		//############-Create slots-#################################

		_core.drawRegisters = function(){
			destroyChildren(srcTable);
			destroyChildren(dstTable);

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
				val.innerHTML = toHex(destination[p]);
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
					val.innerHTML = toHex(sourses[p]);
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
			sourses.ADD  = destination["ADD.A"]  + destination["ADD.B"];
			sourses.ADDC = destination["ADDC.A"] + destination["ADDC.B"] + flags.C;
			sourses.SUB  = destination["SUB.B"]  - destination["SUB.A"];
			sourses.XOR  = destination["XOR.B"]  ^ destination["XOR.A"];
			//hardRegisters[i] = hardRegisters[i] % 0x10000
		};

		_core.refresh = function(){
			//'R2->R1, R3->R5, R7->R10'
			//'R2->R1, NZ? R3->R5, C? R7->R10'

			var slots = getBundleSlots('R8->R1, #20->R5, C? R7->R10');
			executeSlots(slots);
			core.update();
			core.drawRegisters();
		};

		_core.step = function(){
			var s = codeEditor.step();
			currentCommand.innerHTML = s;
		};

		_core.runCommand = function(command){
			var parsed = parseCommand(command);

			if(parsed.const10 || parsed.const16) //const
			   destination[parsed.dst] = parsed.src;
			else //source register
			   destination[parsed.dst] = sourses[parsed.src];
		};

		_core.reset = function(){
			for(var p in destination){
				destination[p] = 0;
			}

			for(var p in sourses){
				sourses[p] = 0;
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