var Writable = require('stream').Writable,
	fs = require('fs'),
	levels = {
		'Log' : 1,
		'Info' : 2,
		'Warn' : 3,
		'Error' : 4
	},
	styles = {
		'Info' : 'blue',
		'Log' : 'green',
		'Warn' : 'magenta',
		'Error' : 'red'
	},
	stylize = function (str, style) {
	    var styles = {
	        //styles
	        'bold': [1, 22],
	        'italic': [3, 23],
	        'underline': [4, 24],
	        'inverse': [7, 27],
	        //grayscale
	        'white': [37, 39],
	        'grey': [90, 39],
	        'black': [90, 39],
	        //colors
	        'blue': [34, 39],
	        'cyan': [36, 39],
	        'green': [32, 39],
	        'magenta': [35, 39],
	        'red': [31, 39],
	        'yellow': [33, 39]
	    };
    	
    	return '\033[' + styles[style][0] + 'm' + str + '\033[' + styles[style][1] + 'm';
	};


function Logger( Yolo ){
	Writable.call(this, {
		decodeStrings : false
	});
	
	this.levels = {
		console : 0,
		file : 5
	};

	if(!fs.existsSync(Yolo.CONFIG + 'logs')){
		console.log("Created Logs Folder");
		fs.mkdirSync(Yolo.CONFIG + 'logs');
	}

	this.logFileStamp = nowStamp();
	this.outStream = getLogFileStream(Yolo.CONFIG + 'logs/' + this.logFileStamp );
	
	this.on('_', function(type, args){
		var log = stylize('[' + new Date().toUTCString() + ']', 'cyan') + stylize('['  + type+ '] ' + args, styles[type]),
			logUnstyled = '[' + new Date().toUTCString() + ']' + '['  + type+ '] ' + args;


		if(this.levels.console <= levels[type]){
			console.log(log);
			this.emit(type, args);
		}

		//move this in own appender
		if(this.levels.file <= levels[type]){
			if(this.logFileStamp != nowStamp()){				
				this.outStream.end();
				this.outStream.destroySoon();

				this.logFileStamp = nowStamp();
				this.outStream = getLogFileStream(Yolo.CONFIG + 'logs/' + this.logFileStamp );
			}

			this.outStream.write(logUnstyled + '\n');
		}

	}, this);
};

Logger.prototype = Object.create( 
	Writable.prototype, { 
		constructor: { 
			value: Logger
		}
	}
);

Logger.prototype._write = function(str, encoding, cb){
	this.emit('_', 'Info', str)
	cb(null);
};
//public
Logger.prototype.log = function(a){
	this.emit('_', 'Log', a);
};

Logger.prototype.info = function(a){
	this.emit('_', 'Info', a);
};

Logger.prototype.warn = function(a){
	this.emit('_', 'Warn', a);
};

Logger.prototype.error = function(a){
	this.emit('_' ,'Error', a);
};

function getLogFileStream(path){
	fs.openSync(path + '.txt', 'a');
	return fs.createWriteStream(path + '.txt', {
		flags : 'a'
	})
}

function nowStamp(){
	var n = new Date();
	return [ n.getFullYear(), ('0'+n.getDate()).slice(-2), ('0'+(n.getMonth()+1)).slice(-2)].join('-');
}

module.exports = Logger;