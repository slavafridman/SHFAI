
var selectedSource;
var selectedTarget;

function selectSourceRow(row,val){
	selectedSource=val;
	var table=document.getElementById("sourceTable");
	var arr=table.getElementsByTagName("td");
	for(i=0;i < arr.length;i++){
		arr[i].className='';
	}
	document.getElementById("srow"+val).className="tr_selected2";
}

function selectTargetRow(row,val){
	selectedTarget=val;
	var table=document.getElementById("targetTable");
	var arr=table.getElementsByTagName("td");
	for(i=0;i < arr.length;i++){
		arr[i].className='';
	}
	document.getElementById("trow"+val).className="tr_selected2";
}

function targetToSource(){
	
	navigate("/shf/cti/unAssignJobToSap.do?code="+selectedTarget);

}

function sourceToTarget(){
	
	navigate("/shf/cti/assignJobToSap.do?code="+selectedSource);
	
}