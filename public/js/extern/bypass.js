//$(document).click('bypass-params', function() {
//
//	if ($("#mw-htmlform-bypass").is(":visible")) {
//		$("#mw-htmlform-bypass").hide();
//	} else {
//		$("#mw-htmlform-bypass").show();
//	}
//});
//
//$('#mw-htmlform-bypass select').live("change", function() {
//	
//	var val = $(this).val();
//	var param = "data-"+this.name;
//	
//	// Modify trigger
//	$(".trigger").attr(param, val);
//});
//
//$('.listbypass .trigger').live('click', function() {
//		
//	console.log("Bypass!");
//        
//	var param = {};
//                
//        //param.date = $(this).attr('data-origin-date');
//        param.id = $(this).attr('data-origin-id');
//        param.param1 = $(this).attr('data-param1');
//        param.param2 = $(this).attr('data-param2');
//        param.param3 = $(this).attr('data-param3');
//        param.param4 = $(this).attr('data-param4');
//        param.param5 = $(this).attr('data-param5');
//
//        param.targetdb = $(this).attr('data-analysis-db');
//
//	
//        //param.type = $(this).attr('data-origin-type');
//	param.type = "blast";
//	//param.target = $(this).attr('data-target-type');
//	param.target = "bypass";
// 
//        $.get( mw.util.wikiScript(), {
//                                format: 'json',
//                                action: 'ajax',
//                                rs: 'SeqAnalyses::sendbypass',
//                                rsargs: [param] // becomes &rsargs[]=arg1&rsargs[]=arg2...
//                        }, function(data) {
//                                
//				$('.listbypass .trigger').hide();
//				$('.listbypass').append("<div class='running'>Running bypass</div>");
//                                window.setTimeout('location.reload()', 2500);
//                                
//        });
//        
//
//});
//
//
//$('.listbypass .bypass').live('click', function() {
//
//	// Get iteration
//	var hashid = $(this).attr("data-analysis-id");
//	var iteration = $("#results").attr("data-iter");
//	var db = $(this).attr("data-analysis-db");
//
//	var realiteration = parseInt(iteration) - 1;
//	
//	$.get( mw.util.wikiScript(), {
//		format: 'json',
//		action: 'ajax',
//		rs: 'BlastParse::getBypass',
//		rsargs: [hashid, realiteration, db] // becomes &rsargs[]=arg1&rsargs[]=arg2...
//	}, function(data) {
//		
//		var jsonobj = jQuery.parseJSON(data);
//
//		// Array of results;
//		var byresults = Array();
//		
//		$(jsonobj[realiteration]["results"]["hits"]).each(function(index) {
//			
//			byresults.push(this);
//			
//			var div = "<ul class='bypass-result'><li class='bypass-Dis'>"+this.Dis+"</li><li class='bypass-Flx'>"+this.Flx+"</li><li class='bypass-Fuz'>"+this.Fuz+"</li><li class='bypass-KD'>"+this.KD+"</li><li>"+this.num+"</li></ul>";
//				
//			var hitid = "#hit"+index;
//			
//			$("#results > "+hitid+" .hitgroup").append(div);
//			
//		});
//		
//		byresults.sort(fuzzycompare);
//				
//		$.each(byresults, function(index){
//			
//			var num = parseInt(this.num);
//			
//			if ( index != num ) {
//				
//				var hitid = "#hit"+num;
//				var newid = "#hit"+index;
//				
//				$(hitid+" .hitgroup").not(".bypassed").each(function(c) {
//					
//					var newdiv = this;
//					
//					if ( index > num ) {
//						$(newdiv).find('.hsp').addClass('hsp-less');
//					} else {
//						$(newdiv).find('.hsp').addClass('hsp-more');
//					}
//					
//					$(this).addClass("bypassed");
//					$(newdiv).appendTo(newid);
//					
//					finalnum = num+1;
//					finalindex = index+1;
//					
//					$(newid+" .bypassed .hitinfo").append("<span class='fromto'> - from "+finalnum+" to "+finalindex+"</span>");
//				});
//				
//			}
//		});
//		
//        });  
//
//});
//
//function addBypassAnalyses( hashid, db ) {
//
//	console.log("BYPASS LIST");
//                        
//        $.get( mw.util.wikiScript(), {
//		format: 'json',
//		action: 'ajax',
//		rs: 'BlastParse::getBypassResult',
//		rsargs: [hashid, db] // becomes &rsargs[]=arg1&rsargs[]=arg2...
//	}, function(data) {
//		
//		var jsonobj = jQuery.parseJSON(data);
//		$(jsonobj).each(function(index) {
//			var id = this.id;
//			var date = this.date;
//			var param1 = this.param1;
//			var param2 = this.param2;
//			var param3 = this.param3;
//			var param4 = this.param4;
//			var param5 = this.param5;
//
//			
//			var analentry = "<li class='bypass' data-analysis-db='"+db+"' data-analysis-id='"+id+"' data-analysis-param1="+param1+" data-analysis-param2="+param2+" data-analysis-param3="+param3+" data-analysis-param4="+param4+" data-analysis-param5="+param5+">"+date+"</li>";
//			$(".listbypass").prepend(analentry);
//
//		});	
//                                
//        });  
//
//}
//
//function printBypass ( hashid, db ) {
//	
//	listBypass = "<h5>Bypass results</h5><ul class='listbypass'>";
//	listBypass+= "<li class='trigger' data-origin-db='"+db+"' data-origin-id='"+hashid+"' data-param1='4' data-param2='0' data-param3='0' data-param4='5' data-param5='1'>Perform Bypass</li>";
//	listBypass+= "<li class='bypass-params'>Parameters</li>";	
//	listBypass+="</ul>";
//	
//	$("#panel").prepend(bypassformtext);
//	$("#panel").prepend(listBypass);
//	
//	addBypassAnalyses(hashid, db);
//	
//}

