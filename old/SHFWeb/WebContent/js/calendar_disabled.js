function getObj(objID)
{
    if (document.getElementById) {return document.getElementById(objID);}
    else if (document.all) {return document.all[objID];}
    else if (document.layers) {return document.layers[objID];}
}

function checkClick(e) {
	e?evt=e:evt=event;
	CSE=evt.target?evt.target:evt.srcElement;
	if (getObj('fc'))
		if (!isChild(CSE,getObj('fc')))
			getObj('fc').style.display='none';
}

function isChild(s,d) {
	while(s) {
		if (s==d) 
			return true;
		s=s.parentNode;
	}
	return false;
}

function Left(obj)
{
	var curleft = 0;
	if (obj.offsetParent)
	{
		while (obj.offsetParent)
		{
			curleft += obj.offsetLeft
			obj = obj.offsetParent;
		}
	}
	else if (obj.x)
		curleft += obj.x;
	return curleft;
}

function Top(obj)
{
	var curtop = 0;
	if (obj.offsetParent)
	{
		while (obj.offsetParent)
		{
			curtop += obj.offsetTop
			obj = obj.offsetParent;
		}
	}
	else if (obj.y)
		curtop += obj.y;
	return curtop;
}
	
document.write('<table id="fc" style="position:absolute;border-collapse:collapse;background:#FFFFFF;border:1px solid #ABABAB;display:none;direction=ltr;z-index:3000;" cellpadding=2>');
document.write('<tr><td style="cursor:pointer" onclick="csubm()"><img src="/shf/images/arrowleftmonth.gif"></td><td colspan=5 id="mns" align="center" style="font:bold 13px Arial"></td><td align="right" style="cursor:pointer" onclick="caddm()"><img src="/shf/images/arrowrightmonth.gif"></td></tr>');
document.write('<tr><td align=center style="background:#cdcdcd;font:12px Arial">א</td><td align=center style="background:#cdcdcd;font:12px Arial">ב</td><td align=center style="background:#cdcdcd;font:12px Arial">ג</td><td align=center style="background:#cdcdcd;font:12px Arial">ד</td><td align=center style="background:#cdcdcd;font:12px Arial">ה</td><td align=center style="background:#cdcdcd;font:12px Arial">ו</td><td align=center style="background:#cdcdcd;font:12px Arial">ש</td></tr>');
for(var kk=1;kk<=6;kk++) {
	document.write('<tr>');
	for(var tt=1;tt<=7;tt++) {
		num=7 * (kk-1) - (-tt);
		document.write('<td id="v' + num + '" class="cal_td" >&nbsp;</td>');
	}
	document.write('</tr>');
}
document.write('</table>');

document.all?document.attachEvent('onclick',checkClick):document.addEventListener('click',checkClick,false);


// Calendar script
var now = new Date;
var sccm=now.getMonth();
var sccy=now.getFullYear();
var ccm=now.getMonth();
var ccy=now.getFullYear();

var updobj;
function lcs(ielem,marginBottom,marginRight) {
	updobj=ielem;
	getObj('fc').style.left=Left(ielem)+marginRight;
	getObj('fc').style.top=Top(ielem)+ielem.offsetHeight+marginBottom;
	getObj('fc').style.display='';
	
	// First check date is valid
	curdt=ielem.value;
	curdtarr=curdt.split('/');
	isdt=true;
	for(var k=0;k<curdtarr.length;k++) {
		if (isNaN(curdtarr[k]))
			isdt=false;
	}
	if (isdt&(curdtarr.length==3)) {
		ccm=curdtarr[1]-1;
		ccy=curdtarr[2];
		prepcalendar(curdtarr[0],curdtarr[1]-1,curdtarr[2]);
	}
	
}

function evtTgt(e)
{
	var el;
	if(e.target)el=e.target;
	else if(e.srcElement)el=e.srcElement;
	if(el.nodeType==3)el=el.parentNode; // defeat Safari bug
	return el;
}
function EvtObj(e){if(!e)e=window.event;return e;}
function cs_over(e) {
	evtTgt(EvtObj(e)).style.background='#FFCC66';
}
function cs_out(e) {
	evtTgt(EvtObj(e)).style.background='#C4D3EA';
}
function cs_click(e) {
	updobj.value=calvalarr[evtTgt(EvtObj(e)).id.substring(1,evtTgt(EvtObj(e)).id.length)];
	getObj('fc').style.display='none';
}

var mn=new Array('ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר');
var mnn=new Array('31','28','31','30','31','30','31','31','30','31','30','31');
var mnl=new Array('31','29','31','30','31','30','31','31','30','31','30','31');
var calvalarr=new Array(42);

function f_cps(obj) {
	obj.style.background='#C4D3EA';
	obj.style.font='10px Arial';
	obj.style.color='#333333';
	obj.style.textAlign='center';
	obj.style.textDecoration='none';
	obj.style.border='1px solid #6487AE';
	obj.style.cursor='pointer';
}



function f_hds(obj) {
	obj.style.background='#FFF799';
	obj.style.font='bold 10px Arial';
	obj.style.color='#333333';
	obj.style.textAlign='center';
	obj.style.border='1px solid #6487AE';
	obj.style.cursor='pointer';
}



// day selected
function prepcalendar(hd,cm,cy) {
	now=new Date();
	sd=now.getDate();
	td=new Date();
	td.setDate(1);
	td.setFullYear(cy);
	td.setMonth(cm);
	cd=td.getDay();
	getObj('mns').innerHTML=mn[cm]+ ' ' + cy;
	marr=((cy%4)==0)?mnl:mnn;
	var tdTmp = td;
	for(var d=1;d<=42;d++) {
		f_cps(getObj('v'+parseInt(d)));
		if ((d >= (cd -(-1))) && (d<=cd-(-marr[cm]))) {
			dip=((d-cd < sd)&&(cm==sccm)&&(cy==sccy));
			htd=((hd!='')&&(d-cd==hd));
			f_cps(getObj('v'+parseInt(d)));
			tdTmp.setDate(d-cd);
			getObj('v'+parseInt(d)).onmouseover=cs_over;
			getObj('v'+parseInt(d)).onmouseout=cs_out;
			if (now < tdTmp) {
				getObj('v'+parseInt(d)).onclick=cs_click;
			} else {
				getObj('v'+parseInt(d)).onclick=null;
				getObj('v'+parseInt(d)).style.cursor='default';
				getObj('v'+parseInt(d)).style.backgroundColor="lightgrey";
				getObj('v'+parseInt(d)).onmouseover=null;
				getObj('v'+parseInt(d)).onmouseout=null;
			}
			getObj('v'+parseInt(d)).innerHTML=d-cd;
			var dayVal=d-cd;
			if(dayVal<10)
				dayVal="0"+dayVal;
			var monthVal=cm-(-1);
			if(monthVal<10)
				monthVal="0"+monthVal;
			calvalarr[d]=(dayVal)+'/'+(monthVal)+'/'+cy;
		}
		else {
			getObj('v'+d).innerHTML='&nbsp;';
			getObj('v'+parseInt(d)).onmouseover=null;
			getObj('v'+parseInt(d)).onmouseout=null;
			getObj('v'+parseInt(d)).style.cursor='default';
			}
	}
}

prepcalendar('',ccm,ccy);
//getObj('fc'+cc).style.visibility='hidden';


function caddm() {
	marr=((ccy%4)==0)?mnl:mnn;
	
	ccm+=1;
	if (ccm>=12) {
		ccm=0;
		ccy++;
	}
	prepcalendar('',ccm,ccy);
}

function csubm() {
	marr=((ccy%4)==0)?mnl:mnn;
	
	ccm-=1;
	if (ccm<0) {
		ccm=11;
		ccy--;
	}
	prepcalendar('',ccm,ccy);
}


function modifyTime(feildname,action){
	
	var timeval=document.getElementById(feildname).value;
	var tarray=timeval.split(":");
	
	var hh;
	hh=parseInt(tarray[0],10);
	var mm;
	mm=parseInt(tarray[1],10);
	
	
	if(isNaN(hh) || isNaN(mm)){
		document.getElementById(feildname).value="00:00";
		return;
	}
	
	/////
	if(mm>59) 
		mm=0;
	mm = mm - (mm%15);
	
	if(hh>23) 
		hh=0;
	//////
	
	if(action==1) {
		if(mm==45){
			mm=0;
			if(hh==23) hh=0;
			else hh=hh+1;
		}
		else{
			mm=mm+15;
		}
		tarray[0]= hh;
		tarray[1]= mm;
		
	}
	else if(action==2) {
		if(hh==23) hh=0;
		else hh=hh+1;
		tarray[0]= hh;
		tarray[1]= mm;
		
	}
	else if(action==3) {
		if(mm==0){
			mm=45;
			if(hh==0) hh=23;
			else hh=hh-1;
		}
		else{
			mm=mm-15;
		}
		tarray[0]= hh;
		tarray[1]= mm;
		
	}
	else if(action==4) {
		if(hh==0) hh=23;
		else hh=hh-1;
		tarray[0]= hh;
		tarray[1]= mm;
		
	}
	
	tarray[0]= hh<10?"0"+hh:hh;
	tarray[1]= mm<10?"0"+mm:mm;
	document.getElementById(feildname).value=tarray[0]+":"+tarray[1];
	
}

