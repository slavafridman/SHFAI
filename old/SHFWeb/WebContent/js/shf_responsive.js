if(document.addEventListener){
	document.addEventListener("DOMContentLoaded",function(e){
		if (top.isMobile){
			top.frames['widthFrames'].cols="*,0";
			var oldTables = $('.respDataTable');	// find all tables to replace
			for (var i=0;i<oldTables.length;i++){	// loop all tables and replace with mobile one
				if($(oldTables[i]).find('div.gridNoData').length == 0){
					$(oldTables[i]).hide();
					if ($(oldTables[i]).hasClass('default')) {
						var newTable = '<table class="respDataTableRslt">';
						var colHdrs = $(oldTables[i]).find('th');
						var rows = $(oldTables[i]).find('tbody tr');
						newTable += '<thead></thead><tbody>';
						for (var m=0;m<rows.length;m++){
							var rowTds = $(rows[m]).find('td');
							newTable += '<tr class="respTrTitle"><td colspan="2"><table><tbody><tr>';
							newTable += '<td class="respColapse"><div><img onclick="respColExp(this)" src="/shf/images/'+(rows.length>1?'expand-medium-blue.png':'collapse-medium-blue.png')+'"></div></td>';
							newTable += ($(oldTables[i]).hasClass('singleSelect')?'<td><input type="checkbox" name="elSelect" class="respSheckBox" onclick="trClick(this,event);"></td>':'');
							var tmpNewTable='';
							for (var k=rowTds.length-1;k>0;k--){
								if ($(colHdrs[k]).find('span').hasClass('respHdr')){
									if( ! $(colHdrs[k]).find('span.respHide,span.respHdrHide').length > 0){	// title header
										newTable += '<td>'+( $(colHdrs[k]).text() === '' ? '' : $(colHdrs[k]).html() )+'- </td>';
									}
									if ( ! isEmpty(rowTds[k]) && $(colHdrs[k]).find('span.respHide').length == 0 ){		// title content
										newTable += '<td>'+$(rowTds[k]).html()+'</td>';
									}
								}
								if ( $(colHdrs[k]).find('span.respHide, span.respHdrOnly').length == 0 ){		// main content
									tmpNewTable += '<tr class="respTr '+(rows.length>1?'respTrColapsed':'respTrExpanded')+'">';
									tmpNewTable += '<td class="respHdr">'+$(colHdrs[k]).html()+'</td>';
									tmpNewTable += '<td class="'+$(rowTds[k]).attr("class")+'">'+$(rowTds[k]).html()+'</td>';
									tmpNewTable += '</tr>';
								}
							}
							newTable += '</tr></tbody></table></td></tr>';
							newTable += tmpNewTable;
							newTable += '<tr class="respTrEnd"><td colspan="2"><hr/></td></tr>';
						}
						newTable += '</tbody></table>';
						newTable += '<div class="respDataTableRsltEnd"/>';
					} else if ($(oldTables[i]).hasClass('respMngRep')){

						var newTable = '<table class="respDataTableRslt respMngRep"><thead></thead><tbody>';
						var colHdrs = $(oldTables[i]).find('th');
						var rows = $(oldTables[i]).find('tbody tr.colapsed[id^=parent]');
						
						for (var m=0;m<rows.length;m++){
							
							var childrenRows = $(rows[m]).nextAll('.'+$(rows[m]).attr('id'));
							var rowTds = $(rows[m]).children('td');
							var colspan = 0;
							newTable += '<tr class="respTrTitle"><td colspan="2"><table><tbody><tr>';
							newTable += '<td class="respColapse"><div><img onclick="respColExp(this)" src="/shf/images/'+(m>0?'expand-medium-blue.png':'collapse-medium-blue.png')+'"/></div></td>';
							var tmpNewTable='';
							var hdrPos = [];
							for (var k=rowTds.length-1;k>=0;k--){
								var hdInd = k > 2 ? k-2 : 0;
								if($(colHdrs[hdInd]).find('span.respHdr').length > 0 ){
									if( $(colHdrs[hdInd]).find('span.respHide, span.respHdrHide').length == 0 ){	// title header
										newTable += '<td>'+( $(colHdrs[hdInd]).text() === '' ? '' : $(colHdrs[hdInd]).html() )+'- </td>';
									}
									if ( ! isEmpty(rowTds[k]) && $(colHdrs[hdInd]).find('span.respHide').length == 0 ){		// title content
										hdrPos.push(hdInd);
										newTable += '<td>'+$(rowTds[k]).html()+'</td>';
									}
								}
								if ( $(colHdrs[hdInd]).find('span.respHide, span.respHdrOnly').length == 0 ){		// main content
									if($(colHdrs[hdInd]).attr('colspan')){
										if(colspan == 0){
											colspan = $(colHdrs[hdInd]).attr('colspan');
										} else {
											colspan--;
										}
									} else{
										colspan = 0;
									} 
									tmpNewTable += (colspan > 0 && colspan != $(colHdrs[hdInd]).attr('colspan') ) ? '':'<tr class="respTr '+(m>0?'respTrColapsed':'respTrExpanded')+'">';
									tmpNewTable += (colspan > 0 && colspan != $(colHdrs[hdInd]).attr('colspan') ) ? '':'<td class="respHdr">'+$(colHdrs[hdInd]).html()+'</td>';
									tmpNewTable += (colspan > 0 && colspan != $(colHdrs[hdInd]).attr('colspan') ) ? '':'<td><table class="colSpanTable"><tbody><tr>';
									tmpNewTable += '<td class="'+$(rowTds[k]).attr("class")+'">'+$(rowTds[k]).html()+'</td>';
									tmpNewTable += (colspan > 0 && colspan != 1) ? '' : '</tr></tbody></table></td>';
									tmpNewTable += (colspan > 0 ) ? '':'</tr>';
								}
							}
							newTable += '</tr></tbody></table></td></tr>';
							newTable += '<tr class="respHdrSub respHdr respTr '+(m>0 ? "respTrColapsed" : "respTrExpanded" )+'"><td colspan=2 class="respTdTitle">משמרת שלי</td></tr>';
							newTable += tmpNewTable;
							
							if(childrenRows.length > 0){	// requests
								newTable += '<tr class="respHdrSub respHdr respTr '+(m>0 ? "respTrColapsed" : "respTrExpanded" )+'"><td colspan=2 class="respTdTitle">הצעות</td></tr>';
								for(var n=0;n<childrenRows.length;n++){
									newTable += '<tr class="respHdrReq respTr '+(m>0 ? "respTrColapsed" : "respTrExpanded" )+'"><td colspan=2 class="respTdTitle"><table><tbody><tr>';
									newTable += '<td class="respColapse"><div><img onclick="respColExp(this);event.preventDefault(); return false;" src="/shf/images/expand-medium-blue.png"/></div></td>';
									rowTds = $(childrenRows[n]).children('td');
									tmpNewTable='';
									for (var k=rowTds.length-1;k>=0;k--){
										var hdInd = k > 2 ? k-2 : 0;
										if(hdrPos.indexOf(k) != -1){
											newTable += '<td>'+$(rowTds[k+2]).html()+'</td>';
										}
										if( k < 3 || k==6 || k==8 || k==9 || k==10){
											
											tmpNewTable += k<2 ? '':'<tr class="respTr respReq respTrColapsed" >';
											tmpNewTable += k<2 ? '':'<td class="respHdr">'+$(colHdrs[hdInd]).html()+'</td>';
											tmpNewTable += k==2 ? '<td><table class="colSpanTable"><tbody><tr>':'';
											tmpNewTable += '<td class="'+$(rowTds[k]).attr("class")+'">'+$(rowTds[k]).html()+'</td>';
											tmpNewTable += k==0 ? '</tr></tbody></table></td>' : '';
											tmpNewTable += k>0&&k<3 ? '':'</tr>';
										}
									}
									newTable +='</tr></tbody></table></td></tr>';
									newTable += tmpNewTable;
								}	// end childrenRows
							}
							newTable += '<tr class="respTrEnd"><td colspan="2"><hr/></td></tr>';
						}
						newTable += '</tbody></table>';
						newTable += '<div class="respDataTableRsltEnd"/>';
					}
					$(oldTables[i]).after(newTable);
				}
			}
			// find all tables to replace END
			$("table.mainMenu td.rightMenuTd table td.mainButtonText",top.right.document).click(function(){hideMenu();});
			$("table.mainMenu td.right_clockarea img",top.right.document).height(36);	// reduce clock img
			parent.document.getElementsByTagName( 'frameset' )[1].rows = "28,*,20";		// reduce top frame
			
			var oldMenus = $('table.sftSubMenu');	// find all sub menus to replace
			for (var i=0;i<oldMenus.length;i++){	// loop all sub menus and replace with mobile one
				var tr = $(oldMenus[i]).find('table').filter(':first').find('tr').filter(':first');
				var newMenu = '<td class="respSubMenu" style="display:block;"><img src="/shf/images/sft_subMenu.png" class="respSubMenuImg" onclick="$(this).closest(\'td.respSubMenu\').find(\'nav\').toggle();drawOverlay(this,event)"><nav style="display:none;"><ul>';
				tr.children('td:not(:last-child)').each(function(){
					if( ! isEmpty(this) && $(this).text() !== '|' ){
						var attrs = '';
						attrs += $(this).find('div.popup').attr('onclick') ? ' onclick= '+$(this).attr('onclick')+' ' : '';
						newMenu +='<li '+attrs+'>'+$(this).find('td.upmenuButtonText').text();
						newMenu += $(this).find('div.popup').prop('outerHTML');
						
						newMenu +='</li>';
					}
				});
				newMenu += '</ul></nav></td>';
				tr.prepend(newMenu);
				
			}
		}
	});
}

function respColExp(e){
	var trTitle = $(e).closest('tr.respTrTitle');
	var subColExp = $(e).closest('tr.respHdrReq');
	if (subColExp.length > 0){
		var targets = $(subColExp).nextUntil('tr.respHdrReq, .respTrEnd');
		if($(targets[0]).is(':visible')){	// close current
			e.src = "/shf/images/expand-medium-blue.png";
			$(targets).removeClass('respTrExpanded').addClass('respTrColapsed');
			
		} else if($(targets[0]).is(':hidden')){	// open current, close others
			$(e).closest('tr.respHdrReq').prevAll('tr.respHdrSub:first').nextAll('.respHdrReq').find('td.respColapse img').attr("src","/shf/images/expand-medium-blue.png");
			e.src = "/shf/images/collapse-medium-blue.png";
			$(targets).removeClass('respTrColapsed').addClass('respTrExpanded');
			$(e).closest('tr.respHdrReq').prevAll('tr.respHdrSub:first').nextAll('.respReq').not(targets).removeClass('respTrExpanded').addClass('respTrColapsed');
			
		}
	} else if(trTitle.next().hasClass('respTrExpanded')){	// if opened, close current only
		var isEnd = false;
		var nextEl = trTitle.next();
		while ( ! isEnd ) {
			e.src = "/shf/images/expand-medium-blue.png";
			nextEl.removeClass('respTrExpanded').addClass('respTrColapsed');
//			if(nextEl.is('.respTrExpanded, .respReq')){
//				e.src = "/shf/images/expand-medium-blue.png";
//				if (nextEl.hasClass('respReq'))
//					nextEl.removeClass('respTrColapsed').addClass('respTrExpanded');
//				else
//					nextEl.removeClass('respTrExpanded').addClass('respTrColapsed');
//			}else{
//				e.src = "/shf/images/collapse-medium-blue.png";
//				if (nextEl.hasClass('respReq'))
//					nextEl.removeClass('respTrExpanded').addClass('respTrColapsed');
//				else
//					nextEl.removeClass('respTrColapsed').addClass('respTrExpanded');
//			}
			if(nextEl.next().hasClass('respTrEnd')){
				isEnd = true;
			} else {
				nextEl = nextEl.next();
			}
		}
	}else{	// if closed, open current and close others
		e.src = "/shf/images/collapse-medium-blue.png";
		var allTrs = $(e).closest('table.respDataTableRslt').find('tr.respTr');
		for (var i=0; i<allTrs.length; i++){	// close opened
			if($(allTrs[i]).hasClass('respReq'))
				$(allTrs[i]).removeClass('respTrExpanded').addClass('respTrColapsed');
			if($(allTrs[i]).hasClass('respHdrReq'))
				$(allTrs[i]).find('td.respColapse img').attr("src","/shf/images/expand-medium-blue.png");
			if($(allTrs[i]).hasClass('respTrExpanded')){
				$(allTrs[i]).removeClass('respTrExpanded').addClass('respTrColapsed');
				$($(allTrs[i]).prevAll('tr.respTrTitle:first').find('td.respColapse img').attr("src","/shf/images/expand-medium-blue.png"));
			}
		}
		var isEnd = false;
		var nextEl = trTitle.next();
		while ( ! isEnd ) {	// open current
			if ( ! nextEl.hasClass('respReq') ) {

				nextEl.removeClass('respTrColapsed').addClass('respTrExpanded');
			}
			
			if(nextEl.next().hasClass('respTrEnd')){
				isEnd = true;
			} else {
				nextEl = nextEl.next();
			}
		}
	}
}
function isEmpty(e){
    return $(e).children().length == 0 && $.trim($(e).text()) === '';
}
function trClick(el){
	if ( ! el.checked ){el.checked = true;return false;}
	$(el).closest('table.respDataTableRslt').find('.respSheckBox').each(function(){
		if(el===this){return true;}
		this.checked = false;
	});
	var tr = el.parentNode.parentNode;
	var index = -1;
	if ($(tr).find('.respColapse').length){
		var myTr = $(tr).closest('tr.respTrTitle');
		var allHdrs = $(tr).closest('table.respDataTableRslt').find('tr.respTrTitle');
		for (var i=0;i<allHdrs.length;i++){
			if($(allHdrs[i]).is(myTr)){
				index = i;
				break;
			}
		}
	}
	if(index>-1){
		tr = $(tr).closest('div#dataGridDiv').find('table.respDataTable').find('tbody tr')[index];
	}
	var clickEvent;
	clickEvent = jQuery.Event("click");
    clickEvent.ctrlKey = 1;  // ctrl click
	$(tr).trigger( clickEvent );
}
function drawOverlay(el,ev){
	if (top.isMobile){
		if(ev.which){
			$("<div id='mOverlay'></div>").prependTo('body').on('click', function(){
				$(this).remove();
				$(el).trigger('click');
			});
		}
	}
}