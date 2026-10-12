package bzq.wfm.report;

import java.util.Collection;
import java.util.Hashtable;
import java.util.Set;

import bzq.shf.bean.AgentDayBean;

public class TamheelReport {
	
	Hashtable<Integer,Integer> shiftsNum;
	Hashtable<Integer,Integer> tamheelSummary;
	
	public TamheelReport(){
		shiftsNum=new Hashtable<Integer, Integer>();
		tamheelSummary=new Hashtable<Integer, Integer>();
	}

	
	public void handleDay(AgentDayBean day) {
		int empid=Integer.parseInt(day.getWmEmpIdNumber());
		if(shiftsNum.get(empid)==null){
			if(day.getWmWorkMinutes()==0){
				shiftsNum.put(empid, 0);
			}else{
				shiftsNum.put(empid, 1);
			}
		}else{
			if(day.getWmWorkMinutes()>0){
				int num=shiftsNum.get(empid);
				shiftsNum.put(empid,num+1);
			}
		}
	}
	
	
	public Hashtable<Integer, Integer> getData(){
		calculate();
		
		return tamheelSummary;
	}
	
	private void calculate(){
		if(shiftsNum!=null){
			Collection<Integer> values=shiftsNum.values();
			if(values!=null){
				for(Integer val:values){
					if(tamheelSummary.get(val)==null){
						tamheelSummary.put(val, 1);
					}else{
						int num=tamheelSummary.get(val);
						tamheelSummary.put(val,num+1);
					}
				}
			}
		}
	}
	
}
