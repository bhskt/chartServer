var	exec=require("child_process").exec,
	express=require("express"),
	moment=require("moment"),
	md5=require("MD5"),
	server=express(),
	log=[],
	stats={requests:2,cacheUsage:1},
	hash=[];
server
	.use("/static",express.static(__dirname +"/static"))
	.use("/chart",express.static(__dirname +"/chart"))
	.get("/",function(req,res){
		res.sendFile("server.htm",{root:__dirname});
	})
	.get("/update",function(req,res){
		res.json({log:log,stats:stats});
		log=[];
	})
	.get("/request",function(req,res){
		var data={
			title:req.param("title"),
			color:req.param("color"),
			limit:req.param("limit"),
			data:req.param("data")
		},
			hashThis=md5(JSON.stringify(data)),
			args=[];
		req={
			ip:req.ip,
			timestamp:moment(Date()).format("hh:mm:ss A"),
			data:JSON.stringify(data),
			hash:hashThis
		}
		if(hash.indexOf(hashThis)>-1){
			req["cache"]=true;
			log.push(req);
			res.end("callback({src:\"chart/"+hashThis+".png\"});");
		} else {
			req["cache"]=false;
			log.push(req);
			hash.push(hashThis);
			data.data.forEach(function(bar,index){
				var X1=25+(index*50),Y1=475,X2=X1+30,Y2=475-(parseInt(bar.value)*450/parseInt(data.limit));
				args.push("-draw \"rectangle "+X1+","+Y1+" "+X2+","+Y2+"\"");
			});
			console.log(JSON.stringify(args));
			args.push(hashThis+".png");
			exec("convert -size "+((50*data.data.length)+50)+"x500 xc:white -fill "+data.color+" -stroke "+data.color+" "+args.join(" "),{
			cwd:__dirname+"/chart"},function(){
				res.end("callback({src:\"chart/"+hashThis+".png\"});");
			});
		}
	})
	.listen(2000);