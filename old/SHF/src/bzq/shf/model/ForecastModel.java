/*
 * Created on 15/03/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.model;
 
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.StringTokenizer;
import java.util.Vector;

import org.apache.commons.validator.GenericValidator;
import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.shf.bean.ActivitiesDbBean;
import bzq.shf.bean.AgentDayBean;
import bzq.shf.bean.ExceptionActivityBean;
import bzq.shf.bean.ExceptionBean;
import bzq.shf.bean.ExceptionSearchBean;
import bzq.shf.bean.ForecastCallsBean;
import bzq.shf.bean.ForecastDataBean;
import bzq.shf.bean.ForecastPerfBean;
import bzq.shf.bean.ForecastSchedualBean;
import bzq.shf.forms.ActivityCallsForm;
import bzq.shf.forms.EventReasonForm;
import bzq.shf.forms.ForecastForm;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;
import bzq.shf.utils.TablesConstants;

import bzq.utils.AppResources;
import bzq.utils.BaseConvert;
import bzq.utils.ConvertException;
import bzq.utils.TablesContainer;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ForecastModel {
	
	private static Logger logger = Logger.getLogger(ForecastModel.class);
	private ForecastForm forecastForm;
	private Date dateFrom=null,dateTo=null;
	private Date dateFromAll=null,dateToAll=null;
	
	public ForecastModel(ForecastForm form){
		this.forecastForm=form;
	}
	
	public void setDefault() throws ShfException{
		logger.debug("Starting setDefault()");
		Date now=new Date();
	
		forecastForm.setDate(now);
		forecastForm.setTimeFrom("07:00");
		forecastForm.setTimeTo("16:00");
		forecastForm.setAllday(false);
		
		if(forecastForm.getAllowedMoked()!=null){
			forecastForm.setMoked(forecastForm.getAllowedMoked());
		}
	}
	
	private void setRangeDates() throws ShfException{
		String dateStr=BaseConvert.dateToString(forecastForm.getDate(),"dd/MM/yyyy");
		
		try{
			
			Calendar calAll=Calendar.getInstance();
			dateFromAll=BaseConvert.stringToDate(dateStr+" 00:00","dd/MM/yyyy HH:mm");
			calAll.setTime(dateFromAll);
			calAll.add(Calendar.DATE,1);
			dateToAll=calAll.getTime();
			
			
			Calendar cal=Calendar.getInstance();
			
			if(forecastForm.isAllday()){
				dateFrom=BaseConvert.stringToDate(dateStr+" 00:00","dd/MM/yyyy HH:mm");
				cal.setTime(dateFrom);
				cal.add(Calendar.DATE,1);
				dateTo=cal.getTime();
			}else{
				dateFrom=BaseConvert.stringToDate(dateStr+" "+forecastForm.getTimeFrom(),"dd/MM/yyyy HH:mm");
				dateTo=BaseConvert.stringToDate(dateStr+" "+forecastForm.getTimeTo(),"dd/MM/yyyy HH:mm");
				cal.setTime(dateTo);
				cal.add(Calendar.HOUR_OF_DAY,1);
				dateTo=cal.getTime();
			}
		}catch(ConvertException e){
			throw new ShfException("");
		}
		
		if(dateTo.before(dateFrom)){
			throw new ShfException("");
		}
	}
	
	//TODO
	public HashMap populateCallForecast() throws ShfException{
		logger.debug("Starting populateCallForecast() ");
		
		HashMap map=null,perfMap=null;
		setRangeDates();
		
		Vector<ForecastDataBean> forecastInfo = getCallsForecast();
//		for (int i=0; i<forecastInfo.size();i++){ //test
//			System.out.println(forecastInfo.size()+" firecastInfo size");
//			System.out.println("char at 88 :"+((ForecastDataBean)forecastInfo.toArray()[i]).getInteractionVolume().charAt(88));
//			
//			for(int j=0;j<((ForecastDataBean)forecastInfo.toArray()[i]).getInteractionVolume().length();j++)
//				System.out.println(((ForecastDataBean)forecastInfo.toArray()[i]).getInteractionVolume().charAt(j));
//			
//			
//			System.out.println((((ForecastDataBean)forecastInfo.toArray()[i]).getInteractionVolume().length() )+" size above");
//			System.out.println(((ForecastDataBean)forecastInfo.toArray()[i]).getDate());
//			System.out.println(((ForecastDataBean)forecastInfo.toArray()[i]).getForecastActivity()+" forecast id");
//			
//		}
		
///////////////////////////		Igal 5.2013
		if ("moked".equals(forecastForm.getRbChoice())){
			if( !(forecastInfo==null) && !"00".equals(forecastForm.getActivityList()[0])){
			
				for (int j=0;j<forecastInfo.size();j++){
					ForecastDataBean forecastDataBean = new ForecastDataBean();
					forecastDataBean =(ForecastDataBean)forecastInfo.get(j);
					String forecastAim = getCallsForecastAim();
					String aimArrayStringAll=new String();
					if (forecastAim!=null){
						forecastDataBean.setAverageHandle(forecastAim);
						String[] aimArray=new String[24];
						aimArray=(forecastAim.split(";"));
						String aimArrayString = new String();
						for(int i=0;i<aimArray.length;i++){
						Float aimFload = new Float(aimArray[i]);
						aimArrayString = getTimeString(aimFload);
						//Time t = new Time(timeCalc * 1000);
						//String hourMinSec = t.toString();
						//String minSec = hourMinSec.substring(3,8);
						if (i < ((aimArray.length)-1 )){
						    aimArrayStringAll = aimArrayStringAll+aimArrayString+";";
						}else{
							aimArrayStringAll = aimArrayStringAll+aimArrayString;
						}
						}
						forecastDataBean.setAverageHandle(forecastAim);
						forecastDataBean.setAverageHandleTime(aimArrayStringAll);
						
						
					}	
			     }
			}
		}
		
///////////////////////////			
			
		else {
			if ( !forecastForm.getVirtualActivity()[0].equals("00") && !(forecastInfo==null) ){
				
				for (int j=0;j<forecastInfo.size();j++){
					ForecastDataBean forecastDataBean = new ForecastDataBean();
					forecastDataBean =(ForecastDataBean)forecastInfo.get(j);
					String forecastAim = getCallsForecastAim();
					String aimArrayStringAll=new String();
					if (forecastAim!=null){
						forecastDataBean.setAverageHandle(forecastAim);
						String[] aimArray=new String[24];
						aimArray=(forecastAim.split(";"));
						String aimArrayString = new String();
						for(int i=0;i<aimArray.length;i++){
						Float aimFload = new Float(aimArray[i]);
						aimArrayString = getTimeString(aimFload);
						//Time t = new Time(timeCalc * 1000);
						//String hourMinSec = t.toString();
						//String minSec = hourMinSec.substring(3,8);
						if (i < ((aimArray.length)-1 )){
						    aimArrayStringAll = aimArrayStringAll+aimArrayString+";";
						}else{
							aimArrayStringAll = aimArrayStringAll+aimArrayString;
						}
						}
						forecastDataBean.setAverageHandle(forecastAim);
						forecastDataBean.setAverageHandleTime(aimArrayStringAll);
						
						
					}	
			     }
			}	
		} // end ESLE
		
		//if (!forecastForm.getVirtualActivity()[0].equals("00")){
		//	String forecastAim = getCallsForecastAim();
			//if (forecastAim==null){
			//	forecastInfo.setAverageHandle(forecastAim);
			 //}
			
		
		//}	
		if(forecastInfo!=null){
			map=(HashMap)parseCallsInfo(forecastInfo);
			perfMap=(HashMap)getActivityPerfData();
			//HashMap mapSum=new HashMap();
			
			if(map!=null){
				if(perfMap!=null){
					Iterator it=perfMap.keySet().iterator();
					while(it.hasNext()){
						String key=(String)it.next();
						ForecastPerfBean perfBean=(ForecastPerfBean)perfMap.get(key);
						String keySum=BaseConvert.dateToString(perfBean.getPeriodStart(),"HH:mm");
						if(map.get(keySum)!=null){
							 int callNumSum=((ForecastCallsBean)map.get(keySum)).getCallsNum();
							((ForecastCallsBean)map.get(keySum)).setCallsNum(perfBean.getCallvol()+callNumSum);
							((ForecastCallsBean)map.get(keySum)).setCallLength((float)perfBean.getHandleTime());
						
						}
					}
				}
				
			}
		}
		return map;
		
	}

	public Vector sumData(Vector localActivies , HashMap map){
	
		
		
		Vector vec=new Vector();
		int sumCallNum=0;
		int sumForecastCallNum=0;
		float sumForecastCallLenght= 0;
		float sumCallLenght= 0;
		float gapForecast = 0;
		float gap = 0;
		float sumGap = 0;
		Integer count2 = 0;
		Integer count = 0;
		Integer countSum = 0;
		Date now = new Date();
		float[] handeTimeArray=new float[localActivies.size()];
		//צריך להחסיר רבע שעה כי לקחת בחשבון את רבע השעה האחרונה     tamar 
		now.setTime(now.getTime()-(60*1000*15));
		
		/*Calendar calNow=Calendar.getInstance();
		calNow.add(Calendar.DATE,-31);
		now.setTime(calNow.getTimeInMillis());
		now.setTime(now.getTime()-(60*1000*60));*/
		
		forecastForm.setSumForecastCallsNum(0);
		
		for(Date i=new Date(dateFrom.getTime());i.before(dateTo);){
	
			ForecastCallsBean q0=(ForecastCallsBean)map.get(BaseConvert.dateToString(i,"HH:mm"));
			i.setTime(i.getTime()+15*60*1000);
			ForecastCallsBean q1=(ForecastCallsBean)map.get(BaseConvert.dateToString(i,"HH:mm"));
			i.setTime(i.getTime()+15*60*1000);
			ForecastCallsBean q2=(ForecastCallsBean)map.get(BaseConvert.dateToString(i,"HH:mm"));
			i.setTime(i.getTime()+15*60*1000);
			ForecastCallsBean q3=(ForecastCallsBean)map.get(BaseConvert.dateToString(i,"HH:mm"));
			i.setTime(i.getTime()+15*60*1000);
			
			
			
	
			//if(q0!=null && q1!=null && q2!=null && q3!=null){
			
			if(q0!=null  || q1!=null || q2!=null || q3!=null){	
				ForecastCallsBean rowMaster=new ForecastCallsBean();
				rowMaster.setTime(q0.getTime());
				if (q0 != null){
					rowMaster.setCallsNum(q0.getCallsNum());
					rowMaster.setForecastCallsNum(q0.getForecastCallsNum());
					rowMaster.setForecastCallLength(q0.getForecastCallLength());
					q0.setCallLengthTime(getTimeString(q0.getCallLength()));
					gap=q0.getCallLength()-q0.getForecastCallLength();
					q0.setGapTime(getTimeString(gap));
					count2++;
					if ((q0.getForecastCallsNum()> 0  && q0.getTime().before(now)) ){
					   sumForecastCallNum=sumForecastCallNum+q0.getForecastCallsNum();	
					   sumForecastCallLenght = sumForecastCallLenght+q0.getForecastCallLength();
					   sumGap=sumGap+gap;
					   sumCallNum=sumCallNum+q0.getCallsNum();
					   countSum++;
					}
					
				 }
				if (q1 != null){
					rowMaster.setCallsNum(rowMaster.getCallsNum()+q1.getCallsNum());
					rowMaster.setForecastCallsNum(rowMaster.getForecastCallsNum()+q1.getForecastCallsNum());
					rowMaster.setForecastCallLength(rowMaster.getForecastCallLength()+q1.getForecastCallLength());
					q1.setCallLengthTime(getTimeString(q1.getCallLength()));
					gap=q1.getCallLength()-q0.getForecastCallLength();
					q1.setGapTime(getTimeString(gap));
				
					count2++;
					if ((q1.getForecastCallsNum()> 0  && q1.getTime().before(now)) ){
						sumForecastCallNum=sumForecastCallNum+q1.getForecastCallsNum();
						sumForecastCallLenght = sumForecastCallLenght+q1.getForecastCallLength();
						sumGap=sumGap+gap;
						 sumCallNum=sumCallNum+q1.getCallsNum();
						countSum++;
					}
					
					
				 }
				if (q2 != null){
					rowMaster.setCallsNum(rowMaster.getCallsNum()+q2.getCallsNum());
					rowMaster.setForecastCallsNum( rowMaster.getForecastCallsNum()+q2.getForecastCallsNum());
					rowMaster.setForecastCallLength(rowMaster.getForecastCallLength()+q2.getForecastCallLength());
					q2.setCallLengthTime(getTimeString(q2.getCallLength()));
					gap=q2.getCallLength()-q0.getForecastCallLength();
					q2.setGapTime(getTimeString(gap));
								
					count2++;
					if ((q2.getForecastCallsNum()> 0 && q2.getTime().before(now)) ){
						sumForecastCallNum=sumForecastCallNum+q2.getForecastCallsNum();
						sumForecastCallLenght = sumForecastCallLenght+q2.getForecastCallLength();
						sumGap=sumGap+gap;
						 sumCallNum=sumCallNum+q2.getCallsNum();
						countSum++;
					}
					
				 }
				if (q3 != null){
					rowMaster.setCallsNum(rowMaster.getCallsNum()+q3.getCallsNum());
					rowMaster.setForecastCallsNum( rowMaster.getForecastCallsNum()+q3.getForecastCallsNum());
					rowMaster.setForecastCallLength(rowMaster.getForecastCallLength()+q3.getForecastCallLength());
					q3.setCallLengthTime(getTimeString(q3.getCallLength()));
					gap=q3.getCallLength()-q0.getForecastCallLength();
					q3.setGapTime(getTimeString(gap));
					count2++;
					if ((q3.getForecastCallsNum()> 0  && q3.getTime().before(now)) ){
						sumForecastCallNum=sumForecastCallNum+q2.getForecastCallsNum();
						sumForecastCallLenght = sumForecastCallLenght+q3.getForecastCallLength();
						sumGap=sumGap+gap;
						 sumCallNum=sumCallNum+q3.getCallsNum();
						countSum++;
					}
					
				 }
				
				rowMaster.setForecastCallLength(rowMaster.getForecastCallLength()/count2);
				
				//rowMaster.setCallsNum(q0.getCallsNum()+q1.getCallsNum()+q2.getCallsNum()+q3.getCallsNum());
				//rowMaster.setForecastCallsNum(q0.getForecastCallsNum()+q1.getForecastCallsNum()+q2.getForecastCallsNum()+q3.getForecastCallsNum());
				//rowMaster.setForecastCallLength((q0.getForecastCallLength()+q1.getForecastCallLength()+q2.getForecastCallLength()+q3.getForecastCallLength())/4);
				rowMaster.setForecastCallLengthTime(q0.getForecastCallLengthTime());
				//gap=rowMaster.getCallLength()-q0.getForecastCallLength();
				//rowMaster.setGapTime(getTimeString(gap));
				
				
				
				
				count = 0;
				
				if(q0.getTime().before(now) && q3.getTime().after(now)){
					if ((q0 != null && q0.getCallLength()>0)  ){
						rowMaster.setCallLength(q0.getCallLength());
						sumCallLenght = sumCallLenght+q0.getCallLength();
						count++;	
					}
					if((q1 != null) && q1.getCallLength()>0){
						rowMaster.setCallLength(rowMaster.getCallLength()+q1.getCallLength());
						sumCallLenght = sumCallLenght+q1.getCallLength();
						count++;	
					}
					if((q2 != null) && q2.getCallLength()>0 ){
						rowMaster.setCallLength(rowMaster.getCallLength()+q2.getCallLength());
						sumCallLenght = sumCallLenght+q2.getCallLength();
						count++;	
					}
					if((q3 != null) && q3.getCallLength()>0){
						rowMaster.setCallLength(rowMaster.getCallLength()+q3.getCallLength());
						sumCallLenght = sumCallLenght+q3.getCallLength();
						count++;	
					}
				}else{
					if (q0 != null  ){
						rowMaster.setCallLength(q0.getCallLength());
						sumCallLenght = sumCallLenght+q0.getCallLength();
					    count++;	
					}
					if(q1 != null){
						rowMaster.setCallLength(rowMaster.getCallLength()+q1.getCallLength());
						sumCallLenght = sumCallLenght+q1.getCallLength();
						count++;	
					}
					if(q2 != null){
						rowMaster.setCallLength(rowMaster.getCallLength()+q2.getCallLength());
						sumCallLenght = sumCallLenght+q2.getCallLength();
						count++;	
					}
					if(q3 != null){
						rowMaster.setCallLength(rowMaster.getCallLength()+q3.getCallLength());
						sumCallLenght = sumCallLenght+q3.getCallLength();
						count++;	
					}
					
				}
					
				if(count!=0){
					rowMaster.setCallLength(rowMaster.getCallLength()/count);	
				}
				rowMaster.setCallLengthTime(getTimeString(rowMaster.getCallLength()));
				gap=rowMaster.getCallLength()-q0.getForecastCallLength();
				rowMaster.setGapTime(getTimeString(gap));
				//tamar-9604
				//sumGap=sumGap+gap;
				//tamar-9604
				count = 0; 
				if(q0!= null &&  q0.getForecastCallsNum()>0 ){
					gapForecast = (((q0.getCallsNum())*100)/(q0.getForecastCallsNum()));
					q0.setGapFromForecast(gapForecast);
					rowMaster.setGapFromForecast(q0.getGapFromForecast());
					count++;
			
				}else{
					//q0 =new ForecastCallsBean();
					q0.setMokedCallLengthList(new Vector());
					q0.setGapFromForecast(0);
					
				}
				if( q1!= null && q1.getForecastCallsNum()>0){
					gapForecast= (((q1.getCallsNum())*100)/(q1.getForecastCallsNum()));
					q1.setGapFromForecast(gapForecast);
					rowMaster.setGapFromForecast(rowMaster.getGapFromForecast()+q1.getGapFromForecast());
					count++;
				}else{
					//q1 =new ForecastCallsBean();
					q1.setMokedCallLengthList(new Vector());
					q1.setGapFromForecast(0);
									
				}
				if(q2!= null  && q2.getForecastCallsNum()>0){
					gapForecast= (((q2.getCallsNum())*100)/(q2.getForecastCallsNum()));
					rowMaster.setGapFromForecast(rowMaster.getGapFromForecast()+q2.getGapFromForecast());
					q2.setGapFromForecast(gapForecast);
					count++;
				}else{
					//q2 = new ForecastCallsBean();
					q2.setMokedCallLengthList(new Vector());
					q2.setGapFromForecast(0);
					
				}
				if(q3!= null  && q3.getForecastCallsNum()>0){
					gapForecast= (((q3.getCallsNum())*100)/(q3.getForecastCallsNum()));
					rowMaster.setGapFromForecast(rowMaster.getGapFromForecast()+q3.getGapFromForecast());
					q3.setGapFromForecast(gapForecast);
					count++;
				}else{
					//q3 = new ForecastCallsBean();
					q3.setMokedCallLengthList(new Vector());
					q3.setGapFromForecast(0);
				}
				if(count > 0){
				  // rowMaster.setGapFromForecast(rowMaster.getGapFromForecast()/count);
				  //gapForecast= (((rowMaster.getCallsNum())*100)/(rowMaster.getForecastCallsNum()));
				   int callNumForecast =0;
				   if(q0.getTime().before(now) && q3.getTime().after(now) ){	
				   
					   if(q0!= null  && q0.getCallsNum()>0 && q0.getForecastCallsNum()>0){
						   callNumForecast=q0.getForecastCallsNum(); 
					   }
					   if(q1!= null  && q1.getCallsNum()>0 && q1.getForecastCallsNum()>0){
						   callNumForecast= callNumForecast+q1.getForecastCallsNum();
					   }		  
					   if(q2!= null  && q2.getCallsNum()>0 && q2.getForecastCallsNum()>0){
						   callNumForecast= callNumForecast+q2.getForecastCallsNum();
					   }
					   if(q3!= null  && q3.getCallsNum()>0 && q3.getForecastCallsNum()>0){
						   callNumForecast= callNumForecast+q3.getForecastCallsNum(); 
					   }
					   if (callNumForecast > 0){
						   gapForecast= (((rowMaster.getCallsNum())*100)/callNumForecast);
						   rowMaster.setGapFromForecast(gapForecast);
					   }
				   }else{
					   if(q0!= null  && q0.getForecastCallsNum()>0){
						   callNumForecast=q0.getForecastCallsNum(); 
					   }
					   if(q1!= null  && q1.getForecastCallsNum()>0){
						   callNumForecast= callNumForecast+q1.getForecastCallsNum();
					   }		  
					   if(q2!= null  && q2.getForecastCallsNum()>0){
						   callNumForecast= callNumForecast+q2.getForecastCallsNum();
					   }
					   if(q3!= null  && q3.getForecastCallsNum()>0){
						   callNumForecast= callNumForecast+q3.getForecastCallsNum(); 
					   }
					   if (callNumForecast > 0){
						   gapForecast= (((rowMaster.getCallsNum())*100)/callNumForecast);
					   		rowMaster.setGapFromForecast(gapForecast);
					   }
					   
				   }
				}   
				
				sumMokedCalls(localActivies,rowMaster,q0.getMokedCallLengthList(),q1.getMokedCallLengthList(),q2.getMokedCallLengthList(),q3.getMokedCallLengthList(),handeTimeArray);
				//tamar-9604
				forecastForm.setSumForecastCallsNum(forecastForm.getSumForecastCallsNum()+rowMaster.getForecastCallsNum());
				forecastForm.setSumCallsNum(forecastForm.getSumCallsNum()+rowMaster.getCallsNum());
				
				//if(rowMaster.getCallsNum()!=0 ){
					//sumCallNum=sumCallNum+rowMaster.getCallsNum();
					//sumForecastCallNum=sumForecastCallNum+rowMaster.getForecastCallsNum();
					
				//}
				//tamar-9604
							
				
				
				if (q0.getForecastCallsNum()+q1.getForecastCallsNum()+q2.getForecastCallsNum()+q3.getForecastCallsNum()+
						q0.getCallsNum()+q1.getCallsNum()+q2.getCallsNum()+q3.getCallsNum()	> 0){
					vec.add(rowMaster);
					vec.add(q0);
					vec.add(q1);
					vec.add(q2);
					vec.add(q3);
				}
				
				
				
			}
		}
		//tamar-9604
		
		if(sumForecastCallNum==0){
		   sumForecastCallNum =sumCallNum;	
		}
		if(forecastForm.getSumCallsNum()!=0 && forecastForm.getSumForecastCallsNum()!=0 ){
			forecastForm.setSumCallVal((sumCallNum*100)/sumForecastCallNum); 
		}
		forecastForm.setSumForecastCallLength(sumForecastCallLenght/countSum);
		sumCallLenght=sumCallLenght/countSum;
		forecastForm.setSumForecastCallLengthTime(getTimeString(forecastForm.getSumForecastCallLength()));
		forecastForm.setSumCallLengthTime(getTimeString(sumCallLenght));
		forecastForm.setSumGapTime(getTimeString(sumGap/countSum));
		String[] handeTimeArrayString=new String[localActivies.size()];
		for(int i=0;i<handeTimeArray.length;i++){
			handeTimeArrayString[i]=getTimeString(handeTimeArray[i]/countSum);
		}
		forecastForm.setSumMokedCallLengthList(handeTimeArrayString);
		//tamar-9604
		return vec;
	}
	public String getTimeString(Float timeSec) {
		String minSec = "";
		if (timeSec < 0) {
			timeSec = Math.abs(timeSec);
			minSec = "-";
		}
		String min = "";
		String sec = "";
		Calendar calendar = null;
		calendar = Calendar.getInstance();		
		calendar.clear();
//		System.out.println("xx = "+calendar.get(Calendar.SECOND));
		calendar.set(0, 0, 0, 0, 0, timeSec.intValue());
		
		sec = "" + calendar.get(Calendar.SECOND);
		if (sec.length() == 1) {
			sec = "0" + sec;
		}
		min += calendar.get(Calendar.MINUTE);
		int t= calendar.get(Calendar.HOUR);
		if (t > 0) {
			t = (60*t) +calendar.get(Calendar.MINUTE);
			min = "" + t;
		}
		if (min.length() == 1) {
			min = "0" + min;
		}
		minSec += min + ":" + sec;
		//System.out.println(minSec);
		return minSec;
	}

	private void sumMokedCalls(Vector localActivies,ForecastCallsBean rowMaster,Vector v0,Vector v1,Vector v2,Vector v3 ,float[] handeTimeArray){
		Vector sumVector=new Vector();
		ActivityCallsForm a0=null,a1=null,a2=null,a3=null;
		for(int i=0;i<localActivies.size();i++){
			if (v0 !=null&& !v0.isEmpty()){
				a0=(ActivityCallsForm)v0.get(i);}
			if (v1 !=null && !v1.isEmpty()){
				a1=(ActivityCallsForm)v1.get(i);}
			if (v2 !=null &&  !v2.isEmpty()){
				a2=(ActivityCallsForm)v2.get(i);}
			if (v3 !=null && !v3.isEmpty()){
				a3=(ActivityCallsForm)v3.get(i);}
			if (a0 !=null){
				a0.setHandleTimeString(getTimeString(a0.getHandleTime()));}
			if (a1 !=null){
				a1.setHandleTimeString(getTimeString(a1.getHandleTime()));}
			if (a2 !=null){
				a2.setHandleTimeString(getTimeString(a2.getHandleTime()));}
			if (a3 !=null){
				a3.setHandleTimeString(getTimeString(a3.getHandleTime()));}
			ActivityCallsForm sum=new ActivityCallsForm();
			Integer count =0;
			Date now = new Date();
			now.setTime(now.getTime()-(60*1000*15));
			/*Calendar calNow=Calendar.getInstance();
			calNow.add(Calendar.DATE,-31);
			now.setTime(calNow.getTimeInMillis());
			now.setTime(now.getTime()-(60*1000*60));*/
			if (a0 !=null && a0.getHandleTime()>0  ){
				count++;
				sum.setHandleTime(a0.getHandleTime());
			/*}else{
				if(a0!=null &&(a0.getPeriod_start()== null ||a0.getPeriod_start().before(now))){
					count++;  	
				}*/
			}
			if (a1 !=null && a1.getHandleTime()>0){
				count++;
				sum.setHandleTime(sum.getHandleTime()+a1.getHandleTime());
			/*}else{
				if(a1!=null && (a1.getPeriod_start()== null ||a1.getPeriod_start().before(now))){
					count++;  	
				}*/
				
			}
			
			if (a2 !=null && a2.getHandleTime()>0){
				count++;
				sum.setHandleTime(sum.getHandleTime()+a2.getHandleTime());
			/*}else{
				if(a2!=null && (a2.getPeriod_start()== null ||a2.getPeriod_start().before(now))){
					count++;  	
				}*/
				
			}
			if (a3 !=null && a3.getHandleTime()>0){
				count++;
				sum.setHandleTime(sum.getHandleTime()+a3.getHandleTime());
			/*}else{
				if(a3!=null && (a3.getPeriod_start()== null ||a3.getPeriod_start().before(now))){
					count++;  	
				}*/
				
			}
			
			if(count!=0){
			   handeTimeArray[i]=handeTimeArray[i]+(sum.getHandleTime());
			   sum.setHandleTime( sum.getHandleTime()/count);
			}   
			sum.setHandleTimeString(getTimeString(sum.getHandleTime()));
			sumVector.add(sum);
		}
		rowMaster.setMokedCallLengthList(sumVector);
	}
	
	private   HashMap parseCallsInfo(Vector forecastInfo){
		 
			HashMap map=null;
			map=new HashMap();
			ForecastDataBean forecastDataBean = new ForecastDataBean();
			
			for (int j=0;j<forecastInfo.size();j++){
				forecastDataBean = new ForecastDataBean();
				forecastDataBean =(ForecastDataBean)forecastInfo.get(j);
				StringTokenizer st=null;
			   Date time=null;	
			   if(forecastDataBean!=null){
				
				try{
				// parse calls number
					if(forecastDataBean.getInteractionVolume()!=null){
						time=new Date(forecastDataBean.getDate().getTime());
						st=new StringTokenizer(forecastDataBean.getInteractionVolume(),";");
						int i=0;
						
						while(st.hasMoreTokens()){
							ForecastCallsBean forecastCallsBean=new ForecastCallsBean();
							ForecastCallsBean forecastCallsBeanSum=new ForecastCallsBean();
							String callsNum=st.nextToken();
							if(!"*".equals(callsNum)){
								//ForecastCallsBean forecastCallsBean=new ForecastCallsBean();
								forecastCallsBean.setTime(new Date(time.getTime()));
								forecastCallsBean.setForecastCallsNum((int)BaseConvert.stringToFloat(callsNum).floatValue());
							
								String timeKey = BaseConvert.dateToString(time,"HH:mm");
								//ForecastCallsBean forecastCallsBeanSum=new ForecastCallsBean();
								forecastCallsBeanSum=(ForecastCallsBean)map.get(timeKey);
								if(forecastCallsBeanSum!=null){
								forecastCallsBean.setForecastCallsNum(forecastCallsBean.getForecastCallsNum()+forecastCallsBeanSum.getForecastCallsNum());
								forecastCallsBean.setForecastCallLength(forecastCallsBean.getForecastCallLength()+forecastCallsBeanSum.getForecastCallLength());
								
																}					
								map.put(BaseConvert.dateToString(time,"HH:mm"),forecastCallsBean);
								
							} else {
								//ForecastCallsBean forecastCallsBean=new ForecastCallsBean();
								forecastCallsBean.setTime(new Date(time.getTime()));
								forecastCallsBean.setForecastCallsNum((int)BaseConvert.stringToFloat("0").floatValue());
							
								String timeKey = BaseConvert.dateToString(time,"HH:mm");
								//ForecastCallsBean forecastCallsBeanSum=new ForecastCallsBean();
								forecastCallsBeanSum=(ForecastCallsBean)map.get(timeKey);
								if(forecastCallsBeanSum!=null){
								forecastCallsBean.setForecastCallsNum(forecastCallsBean.getForecastCallsNum()+forecastCallsBeanSum.getForecastCallsNum());
								forecastCallsBean.setForecastCallLength(forecastCallsBean.getForecastCallLength()+forecastCallsBeanSum.getForecastCallLength());
								
																}					
								map.put(BaseConvert.dateToString(time,"HH:mm"),forecastCallsBean);
							}
							time.setTime(time.getTime()+15*60*1000);
						//BUG : at this point it goes each time by changing clock from summer clock to winter clock
							i++;
						}
				}
				// parse calls average handle
				if(forecastDataBean.getAverageHandle()!=null){
					time=new Date(forecastDataBean.getDate().getTime());
					st=new StringTokenizer(forecastDataBean.getAverageHandle(),";");
					int i=0;
					while(st.hasMoreTokens() ){
						String avg=st.nextToken();
					
							float avgFloat=BaseConvert.stringToFloat(avg).floatValue();
							if(map.get(BaseConvert.dateToString(time,"HH:mm"))!=null){
								((ForecastCallsBean)map.get(BaseConvert.dateToString(time,"HH:mm"))).setForecastCallLength(avgFloat);
							}else{
								ForecastCallsBean forecastCallsBean=new ForecastCallsBean();
								forecastCallsBean.setTime(new Date(time.getTime()));
								forecastCallsBean.setForecastCallLength(avgFloat);
								map.put(BaseConvert.dateToString(time,"HH:mm"),forecastCallsBean);
							}		
							time.setTime(time.getTime()+15*60*1000);
							if(map.get(BaseConvert.dateToString(time,"HH:mm"))!=null){	 
								 ((ForecastCallsBean)map.get(BaseConvert.dateToString(time,"HH:mm"))).setForecastCallLength(avgFloat);
							}else{
								ForecastCallsBean forecastCallsBean=new ForecastCallsBean();
								forecastCallsBean.setTime(new Date(time.getTime()));
								forecastCallsBean.setForecastCallLength(avgFloat);
								map.put(BaseConvert.dateToString(time,"HH:mm"),forecastCallsBean);
							}		 
							time.setTime(time.getTime()+15*60*1000);
							if(map.get(BaseConvert.dateToString(time,"HH:mm"))!=null){
							      ((ForecastCallsBean)map.get(BaseConvert.dateToString(time,"HH:mm"))).setForecastCallLength(avgFloat);
							}else{
								ForecastCallsBean forecastCallsBean=new ForecastCallsBean();
								forecastCallsBean.setTime(new Date(time.getTime()));
								forecastCallsBean.setForecastCallLength(avgFloat);
								map.put(BaseConvert.dateToString(time,"HH:mm"),forecastCallsBean);
							}	     
							time.setTime(time.getTime()+15*60*1000);
							if(map.get(BaseConvert.dateToString(time,"HH:mm"))!=null){
								 ((ForecastCallsBean)map.get(BaseConvert.dateToString(time,"HH:mm"))).setForecastCallLength(avgFloat);
																				
							}else{
								ForecastCallsBean forecastCallsBean=new ForecastCallsBean();
								forecastCallsBean.setTime(new Date(time.getTime()));
								forecastCallsBean.setForecastCallLength(avgFloat);
								map.put(BaseConvert.dateToString(time,"HH:mm"),forecastCallsBean);
							}	
						
						i++;
						time.setTime(time.getTime()+15*60*1000);
					}
				}
				if(forecastDataBean.getAverageHandleTime()!=null){
					time=new Date(forecastDataBean.getDate().getTime());
					st=new StringTokenizer(forecastDataBean.getAverageHandleTime(),";");
					int i=0;
					while(st.hasMoreTokens() ){
						String avg=st.nextToken();
					
							
							if(map.get(BaseConvert.dateToString(time,"HH:mm"))!=null){
								((ForecastCallsBean)map.get(BaseConvert.dateToString(time,"HH:mm"))).setForecastCallLengthTime(avg);
							}else{
								ForecastCallsBean forecastCallsBean=new ForecastCallsBean();
								forecastCallsBean.setTime(new Date(time.getTime()));
								forecastCallsBean.setForecastCallLengthTime(avg);
								map.put(BaseConvert.dateToString(time,"HH:mm"),forecastCallsBean);
							}		
							time.setTime(time.getTime()+15*60*1000);
							if(map.get(BaseConvert.dateToString(time,"HH:mm"))!=null){	 
								((ForecastCallsBean)map.get(BaseConvert.dateToString(time,"HH:mm"))).setForecastCallLengthTime(avg);
							}else{
								ForecastCallsBean forecastCallsBean=new ForecastCallsBean();
								forecastCallsBean.setTime(new Date(time.getTime()));
								forecastCallsBean.setForecastCallLengthTime(avg);
								map.put(BaseConvert.dateToString(time,"HH:mm"),forecastCallsBean);
							}		
							time.setTime(time.getTime()+15*60*1000);
							if(map.get(BaseConvert.dateToString(time,"HH:mm"))!=null){
								 ((ForecastCallsBean)map.get(BaseConvert.dateToString(time,"HH:mm"))).setForecastCallLengthTime(avg);
							}else{
								ForecastCallsBean forecastCallsBean=new ForecastCallsBean();
								forecastCallsBean.setTime(new Date(time.getTime()));
								forecastCallsBean.setForecastCallLengthTime(avg);
								map.put(BaseConvert.dateToString(time,"HH:mm"),forecastCallsBean);
							}		 
							time.setTime(time.getTime()+15*60*1000);
							if(map.get(BaseConvert.dateToString(time,"HH:mm"))!=null){
								((ForecastCallsBean)map.get(BaseConvert.dateToString(time,"HH:mm"))).setForecastCallLengthTime(avg);
								 
							}else{
								ForecastCallsBean forecastCallsBean=new ForecastCallsBean();
								forecastCallsBean.setTime(new Date(time.getTime()));
								forecastCallsBean.setForecastCallLengthTime(avg);
								map.put(BaseConvert.dateToString(time,"HH:mm"),forecastCallsBean);
							}	
						
						i++;
						time.setTime(time.getTime()+15*60*1000);
					}
				}
			
			}catch(ConvertException e){
//				System.out.println(e.getMessage());
			}
		  }
		}	
		return map;
		
	}
	
	private Vector<ForecastDataBean> getCallsForecast() throws ShfException {
		int param=1;
		Vector <ForecastDataBean> vector=null;
		//ForecastDataBean forecastInfo=null;
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT d.* FROM SHIFTER.shf_forecast_activities a ");
		sql.append("LEFT join SHIFTER.shf_forecast_data d ON ");
		sql.append("a.wm_forecast_activity_id=d.wm_forecast_activity_id ");
		sql.append("WHERE d.wm_date=? ");
		//sql.append("AND a.wm_virtual_activity_id=? and d.WM_INTERACTION_VOLUME is not null");
		sql.append("and d.WM_INTERACTION_VOLUME is not null");
		
		if ("activity".equals(forecastForm.getRbChoice())) { // תור ארצי
			if ( !forecastForm.getVirtualActivity()[0].equals("00")){
				sql.append(" AND  a.wm_virtual_activity_id IN ( "); 
				for(int i=0;i<forecastForm.getVirtualActivity().length;i++){
					sql.append(forecastForm.getVirtualActivity()[i]);
					if(i<forecastForm.getVirtualActivity().length-1) sql.append(",");
				}
				sql.append(") ");
				
			 }
		}
		
////////////// Igal 5.2013
		
		else if ("moked".equals(forecastForm.getRbChoice())){ // if local activities 
				sql.append(" AND  a.wm_activity_id IN ( ");
				if(!"00".equals(forecastForm.getActivityList()[0])){ // if "all" NOT checked, get selected activities
					for (int i=0; i<forecastForm.getActivityList().length;i++){
						sql.append(forecastForm.getActivityList()[i]);
						if(i<forecastForm.getActivityList().length-1) sql.append(",");
						}
						
					}
				else { // "all" checked
					for (int i=0; i<forecastForm.getLocalActArr().length;i++){
						sql.append(forecastForm.getLocalActArr()[i]);
						if(i<forecastForm.getLocalActArr().length-1) sql.append(",");
					}
						
					
				}
				sql.append(") ");
		}
///////////////////////////		
		
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setTimestamp(param++,forecastForm.getDate());
		//	db.setString(param++,forecastForm.getVirtualActivity());
			db.executeQuery();
			vector=new Vector<ForecastDataBean>();
			db.populate("bzq.shf.bean.ForecastDataBean", vector);
			
			//forecastInfo=new ForecastDataBean();
			//db.populate(forecastInfo);
		}catch(DBQueryNoRowsException e){
			
		}catch(DBException e){
			logger.error("error in getCallsForecast() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try{
				db.close();
			}catch (DBException e) {
				logger.error("error in getCallsForecast() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		return vector;
	}
	//tamar-30.11.10
	private String getCallsForecastAim() throws ShfException {
	//	int param=1;
		String forecastAim=null;
		Calendar cal=Calendar.getInstance();
		cal.add(Calendar.HOUR_OF_DAY,1);
		cal.get(Calendar.DAY_OF_WEEK);
		Integer dayt= forecastForm.getDate().getDay();
		dayt++;
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT a.activity_aim FROM SHIFTER.shf_activity_call_time_aim a ");
		
///////////// Igal 5.2013
		if ("moked".equals(forecastForm.getRbChoice())){ // if local activity
			if ( !"00".equals(forecastForm.getActivityList()[0])){ // if "all" NOT checked, get selected only
				sql.append(" where  a.activity_type_id  in( "); 
				for(int i=0;i<forecastForm.getActivityList().length;i++){
					sql.append(forecastForm.getActivityList()[i]);
					if(i<forecastForm.getActivityList().length-1) sql.append(",");
				}
				
				sql.append(") ");
				sql.append(" and  a.activity_day = ? ");
			 }			
		}
/////////////////////////
		else {
			if ( !forecastForm.getVirtualActivity()[0].equals("00")){
				sql.append(" where  a.activity_type_id  in( "); 
				for(int i=0;i<forecastForm.getVirtualActivity().length;i++){
					sql.append(forecastForm.getVirtualActivity()[i]);
					if(i<forecastForm.getVirtualActivity().length-1) sql.append(",");
				}
				
				sql.append(") ");
				sql.append(" and  a.activity_day = ? ");
			 }
		}
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInteger(1,dayt);
			db.executeQuery();
			if (db.getString(1)!= null){
			    forecastAim=new String(db.getString(1));
			}    
			

		}catch(DBQueryNoRowsException e){
			
		}catch(DBException e){
			logger.error("error in getCallsForecastAim() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try{
				db.close();
			}catch (DBException e) {
				logger.error("error in getCallsForecastAim() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		return forecastAim;
	}
	//tamar-30.11.10
	
	private HashMap getActivityPerfData() throws ShfException{
		logger.debug("beginning getForecastData() method.");
		
		String  dateFromString =  BaseConvert.dateToString(dateFrom,"dd/MM/yyyy") + " " + BaseConvert.dateToString(dateFrom,"HH:mm");
		String  dateToString =  BaseConvert.dateToString(dateTo,"dd/MM/yyyy") + " " + BaseConvert.dateToString(dateTo,"HH:mm");
		String  dateFromAllString =  BaseConvert.dateToString(dateFromAll,"dd/MM/yyyy") + " " + BaseConvert.dateToString(dateFromAll,"HH:mm");
		HashMap hm=new HashMap();
		StringBuffer sql=new StringBuffer();
		//sql.append("select t.* from SHIFTER.shf_perf_activities t ");
		sql.append("select t.* from v_wfm_perf_activities t ");
		sql.append("where t.wm_period_start >= to_date('"+ dateFromString +"','dd/mm/yyyy HH24:mi') ");
		if(forecastForm.isAllday()){
			sql.append(" and t.wm_period_start< to_date('"+ dateToString +"','dd/mm/yyyy HH24:mi') ");
		}else{
			sql.append(" and t.wm_period_start<= to_date('"+ dateToString +"','dd/mm/yyyy HH24:mi') ");
		}	
		//sql.append("and t.WM_VIRTUAL_ACTIVITY_ID = ? ");

//////////// Igal 5.2013
		if ("moked".equals(forecastForm.getRbChoice())){ // if local activity
			
			if ("00".equals(forecastForm.getActivityList()[0])){ // if "all" checked
				sql.append(" and t.WM_ACTIVITY_ID in ( "); 
				sql.append("SELECT a.wm_activity_id FROM ");
				sql.append("SHIFTER.shf_forecast_activities a ");
				sql.append("LEFT join SHIFTER.shf_forecast_data d ON a.wm_forecast_activity_id=d.wm_forecast_activity_id ");
				sql.append(" WHERE d.wm_date >= to_date('"+ dateFromAllString +"','dd/mm/yyyy HH24:mi') ");
				sql.append("and  a.wm_activity_id in (");
				for(int i=0;i<forecastForm.getLocalActArr().length;i++){
					sql.append(forecastForm.getLocalActArr()[i]);
					if(i<forecastForm.getLocalActArr().length-1) sql.append(",");
				}
				
			}
			else { // "all" NOT checked
				
				sql.append(" and t.WM_ACTIVITY_ID in ( "); 
				sql.append("SELECT a.wm_activity_id FROM ");
				sql.append("SHIFTER.shf_forecast_activities a ");
				sql.append("LEFT join SHIFTER.shf_forecast_data d ON a.wm_forecast_activity_id=d.wm_forecast_activity_id ");
				sql.append(" WHERE d.wm_date >= to_date('"+ dateFromAllString +"','dd/mm/yyyy HH24:mi') ");
				sql.append("and  a.wm_activity_id in (");
				for(int i=0;i<forecastForm.getActivityList().length;i++){
					sql.append(forecastForm.getActivityList()[i]);
					if(i<forecastForm.getActivityList().length-1) sql.append(",");
				}
			}
			sql.append(")) ");

		}
////////////////////////		
		else {
			if ( !forecastForm.getVirtualActivity()[0].equals("00")){
			sql.append(" and t.WM_VIRTUAL_ACTIVITY_ID in ( "); 
			sql.append("SELECT a.wm_virtual_activity_id FROM ");
			sql.append("SHIFTER.shf_forecast_activities a ");
			sql.append("LEFT join SHIFTER.shf_forecast_data d ON a.wm_forecast_activity_id=d.wm_forecast_activity_id ");
			sql.append(" WHERE d.wm_date >= to_date('"+ dateFromAllString +"','dd/mm/yyyy HH24:mi') ");
			sql.append("and  a.wm_virtual_activity_id in (");
			for(int i=0;i<forecastForm.getVirtualActivity().length;i++){
				sql.append(forecastForm.getVirtualActivity()[i]);
				if(i<forecastForm.getVirtualActivity().length-1) sql.append(",");
			}
			
			sql.append(")) ");
			//tamar			
		}else{
			sql.append("and t.WM_VIRTUAL_ACTIVITY_ID in(select distinct d.virtual_activity_id from shifter.shf_virtual_activities d)");	
		}
	
			//tamar
		}
		
		DBAccess db=null;		
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
//			db.setTimestamp(param++,dateFrom);
//			db.setTimestamp(param++,dateTo);
//			if ( !forecastForm.getVirtualActivity()[0].equals("00")){
//				db.setTimestamp(param++,dateFromAll);
//			}
		//	db.setTimestamp(param++,dateFrom);
			//db.setString(param++,forecastForm.getVirtualActivity());
			db.executeQuery();
			ForecastPerfBean perfInfo=null;
			while(db.next()){	
				perfInfo=new ForecastPerfBean();
				db.populate(perfInfo);
				hm.put(BaseConvert.dateToString(perfInfo.getPeriodStart(),"HH:mm")+perfInfo.getVirtualActivity(),perfInfo);
			}
		
		}catch(DBQueryNoRowsException e){
		//	form.setPerfAvailable(false);
		}catch(DBException e){
			logger.error("error in getActivityPerfData(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try{
				db.close();
			}catch (DBException e) {
				logger.error("error in getActivityPerfData() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		return hm;
	}
	
	public Vector <ActivityCallsForm> populateLocalActivities(String[] Activities) throws ShfException{
	
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT ");
		sql.append("t.ACTIVITY_TYPE_ID as CODE, ");
		sql.append("t.ACTIVITY_TYPE_NAME as DESCRIPTION, ");
		sql.append("t.SHORT_NAME, ");
		sql.append("t.SITE_ID, ");
		sql.append("t.VIRTUAL_ACTIVITY_ID ");
		sql.append("FROM SHIFTER.SHF_ACTIVITY_TYPE t ");
		
		//Igal 5.2013
			
		if ("moked".equals(forecastForm.getRbChoice())){ // if radio button is local activity
			sql.append("WHERE t.VIRTUAL_ACTIVITY_ID IS NULL "); 
			if ("00".equals(forecastForm.getActivityList()[0]) && forecastForm.getActivityList().length>1 ){ // if "all" checked in local activities and at least 1 activity exists
				sql.append("AND t.ACTIVITY_TYPE_ID in ( "); 
				for(int i=0;i<forecastForm.getActivityList().length;i++){ // get all the activities
					sql.append(forecastForm.getActivityList()[i]);
					if(i<forecastForm.getActivityList().length-1) sql.append(",");					
			}
			sql.append(") ");
			}
			else {
				sql.append("AND  t.ACTIVITY_TYPE_ID in ( "); // get selected activities
				for(int i=0;i<Activities.length;i++){
					sql.append(Activities[i]);
					if(i<Activities.length-1) sql.append(",");
			}
			sql.append(") ");
				
			}
			
		}
		
		else // if radio button is VIRTUAL activity
			if ( !Activities[0].equals("00")){
				sql.append("WHERE  t.VIRTUAL_ACTIVITY_ID in ( "); 
				for(int i=0;i<Activities.length;i++){
					sql.append(Activities[i]);
					if(i<Activities.length-1) sql.append(",");
			}
			sql.append(") ");
			
		 }
	
	
		sql.append("ORDER BY t.ACTIVITY_TYPE_ID");
		Vector localActivities=new Vector();
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			//if ( !virtualActivity[0].equals("00")){
			//	db.setString(param_index++,virtualActivity[param_index]);
			//}
			//db.setString(1,virtualActivity);
			db.executeQuery();

			ActivityCallsForm activity=null;
			while(db.next()){
				activity=new ActivityCallsForm();
				db.populate(activity);
				localActivities.add(activity);
			}
			
		}catch(DBQueryNoRowsException e){
			
		}catch(DBException e){
			logger.error("error in populateLocalActivities(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try{
				db.close();
			}catch (DBException e) {
				logger.error("error in populateLocalActivities() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		
		return localActivities;
	}
	
	private ActivityCallsForm populateLocalActivityCalls(DBAccess db, ActivityCallsForm Activity,Date time) throws ShfException{

		
		String  timeString =  BaseConvert.dateToString(time,"dd/MM/yyyy") + " " + BaseConvert.dateToString(time,"HH:mm");
		ActivityCallsForm activityCallsForm=null;
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT a.activity_type_id as CODE , a.activity_type_name as DESCRIPTION , "); 
		sql.append("a.short_name ,a.site_id,a.virtual_activity_id, ");
		sql.append("t.wm_period_start,t.wm_handle_time,t.wm_callvol ");
		sql.append("FROM v_wfm_perf_activities t  ");
		sql.append("LEFT JOIN shifter.shf_activity_type a on t.wm_activity_id=a.activity_type_id ");
		sql.append("WHERE t.wm_activity_id= " + Activity.getCode()+" "); 
		sql.append("and t.wm_period_start = to_date('"+ timeString +"','dd/mm/yyyy HH24:mi') "); 
		
		try{
			db.prepareStatement(sql.toString());
//			System.out.println("befor : " + System.currentTimeMillis());
			db.executeQuery();
//			System.out.println("after : " + System.currentTimeMillis());
			activityCallsForm=new ActivityCallsForm();
			db.populate(activityCallsForm);
		}catch(DBQueryNoRowsException e){
			
		}catch(DBException e){
			logger.error("error in getActivityPerfData(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}
		return activityCallsForm;
	}
	
	
	public void populateLocalActivities(Vector localActivities,HashMap forecastData) throws ShfException{
		ActivityCallsForm activity=null;
		ForecastCallsBean forecastBean=null;
		
		DBAccess db=null;
		try{
			db=new DBAccess();
			for(int i=0;i<localActivities.size();i++){
				activity=(ActivityCallsForm)localActivities.get(i);
				Iterator it=forecastData.values().iterator();
				while(it.hasNext()){
					forecastBean=(ForecastCallsBean)it.next();
					if(forecastBean.getMokedCallLengthList()==null){
						forecastBean.setMokedCallLengthList(new Vector());
					}
					ActivityCallsForm activityCallsForm=populateLocalActivityCalls(db,activity,forecastBean.getTime());
					if(activityCallsForm==null){
						activityCallsForm=new ActivityCallsForm();
						
					}
					forecastBean.getMokedCallLengthList().add(activityCallsForm);
				}
			}
		} finally{
			try{
				db.close();			}catch (DBException e) {
				logger.error("error in populateLocalActivities() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}	
	}
	
	public Vector populateSchedualForecast() throws ShfException{
		logger.debug("Starting populateSchedualForecast()");
		//Yuval Ovadia
		Vector result=null;
		Vector<ForecastDataBean> forecastDataVec = getSchedualForecast();
		setRangeDates();
		
		if(forecastDataVec!=null){
			result=parseSchInfo(forecastDataVec); // <-create forecastSchedualBean and populate calc + req
										// "result" holds the amount of beans in the user selected time range every 15 min
										// i.e. user select 7-8, the "result" = 1st bean 07:00, 2nd 07:15, 3rd 07:30... last 09:00
										// every bean contains time (i.e. 07:00), calculated(TekhnonMaty) and required(usually null) staffing.
			//ForecastSchedualBean forecastSchedualBean= new ForecastSchedualBean();
			if (forecastForm.isWithWfm()) { 
				setShebotsWFM(result); 
				}
			setShebotsSHF(result);
			if (forecastForm.isWithWfm()) {
				setBreakDataWFM(result);
				}
			setBreakDataSHF(result);
			
			if (forecastForm.getRbChoice().equals("moked")) { //talk with Yael, there is no way to get exceptions for virtually activity, there for we decided no to show the data
				if (forecastForm.isWithWfm()) {
					setExceptionDataWFM(result);
				}
				setExceptionDataSHF(result);
			}
			
			setArrivalsDataNew(result);
			setCanceledData(result);
			for(int i=0;i<result.size();i++){
				ForecastSchedualBean forecastSchedualBean=(ForecastSchedualBean)result.get(i);
				//forecastSchedualBean.setSum(forecastSchedualBean.getAfterChanges()-forecastSchedualBean.getMissing());
				forecastSchedualBean.setDifference(forecastSchedualBean.getSum()-forecastSchedualBean.getTekhnonMaty());
			}
		}
		return result;
	}
	private void setBreakDataWFM(Vector result) throws ShfException {
		// Yuval Ovadia
		Vector beakExcep = getBreaksSumDataWFM();
		ForecastSchedualBean forecastSchedualBean = new ForecastSchedualBean();
		
		for(int i=0;i<result.size();i++) {
			forecastSchedualBean=(ForecastSchedualBean)result.get(i);
			double sum=0;
			if (beakExcep!=null) {
				for (int j=0;j<beakExcep.size();j++) {
					//check if the shift is in the range for calculate data
					ExceptionBean breakBean=(ExceptionBean)beakExcep.get(j);
					Calendar endRange = Calendar.getInstance();
					endRange.setTime(forecastSchedualBean.getTime());
					endRange.add(Calendar.MINUTE, SHFConstants.FORECAST_TIME_INTERVAL);
					if ( (breakBean.getStartTime().getTime() < endRange.getTime().getTime()) 
						&& 
						(breakBean.getEndTime().getTime() > forecastSchedualBean.getTime().getTime()) ) 
						{
						
						double breakSum=0;
						long minus=0;
						// if not in the two conditions then breakSum = 1 (minus=0)
						if ( ( breakBean.getStartTime().getTime() > forecastSchedualBean.getTime().getTime()) ) {
							minus = breakBean.getStartTime().getTime() - forecastSchedualBean.getTime().getTime();
						}
						if ( endRange.getTime().getTime() > breakBean.getEndTime().getTime() ){
							minus = minus + (endRange.getTime().getTime() - breakBean.getEndTime().getTime());
						}
						breakSum = (SHFConstants.FORECAST_TIME_INTERVAL - minus/60000) * SHFConstants.FORECAST_CALC;
						sum=sum+breakSum;
					}
				}
			}
			forecastSchedualBean.setBreakExcepWFM(sum);
		}
	}	
	private void setBreakDataSHF(Vector result) throws ShfException {
		// Yuval Ovadia
		Vector beakExcep = getBreaksSumDataSHF();
		ForecastSchedualBean forecastSchedualBean = new ForecastSchedualBean();
		
		for(int i=0;i<result.size();i++) {
			forecastSchedualBean=(ForecastSchedualBean)result.get(i); // each bean is a row every 15 min
			double sum=0; // the sum of breaks for each bean (row) 
			if (beakExcep!=null) {
				for (int j=0;j<beakExcep.size();j++) {
					//check if the shift is in the range for calculate data
					ExceptionBean breakBean=(ExceptionBean)beakExcep.get(j);
					Calendar endRange = Calendar.getInstance();
					endRange.setTime(forecastSchedualBean.getTime());
					endRange.add(Calendar.MINUTE, SHFConstants.FORECAST_TIME_INTERVAL); // 15 min ahead of current bean,
																						// ex. bean 08:15 then endRange 08:30
					if ( (breakBean.getStartTime().getTime() < endRange.getTime().getTime()) // if break in range
						&& 
						(breakBean.getEndTime().getTime() > forecastSchedualBean.getTime().getTime()) ) 
						{
						double breakSum=0;
						long minus=0;
						// if not in the two below conditions then breakSum = 1 (minus=0), because break in whole range of 15 min
						if ( ( breakBean.getStartTime().getTime() > forecastSchedualBean.getTime().getTime()) ) { // if only break START
																												  // in range
							minus = breakBean.getStartTime().getTime() - forecastSchedualBean.getTime().getTime();
						}
						if ( endRange.getTime().getTime() > breakBean.getEndTime().getTime() ){ // if only break END
							  																	// in range
							minus = minus + (endRange.getTime().getTime() - breakBean.getEndTime().getTime());
						}
						breakSum = (SHFConstants.FORECAST_TIME_INTERVAL - minus/60000) * SHFConstants.FORECAST_CALC;

						// Svetlana
						//sum=sum+breakSum;
						double counterWmActivityId = 0;
						if( forecastForm.getActivityList()!=null && (!"00".equals(forecastForm.getActivityList()[0]))){
							counterWmActivityId = counterWmActivityId(breakBean.getWmActivityId(),forecastForm.getActivitiesForSelect());
						}
						if(counterWmActivityId > 0){
							sum=sum + (breakSum * counterWmActivityId);
						}else{
							sum=sum+breakSum;
						}
						
					}
				}
			}
			forecastSchedualBean.setBreakExcepSHF(sum);
		}
//		int hh=0;
		
	}

	private void setExceptionDataWFM(Vector result) throws ShfException {
		// Yuval Ovadia
		Vector exceptionExcep = getExceptionSumDataWFM();
		ForecastSchedualBean forecastSchedualBean = new ForecastSchedualBean();
		
		for(int i=0;i<result.size();i++) {
			forecastSchedualBean=(ForecastSchedualBean)result.get(i);
			double sum=0;
			if (exceptionExcep!=null) {
				for (int j=0;j<exceptionExcep.size();j++) {
					//check if the shift is in the range for calculate data
					ExceptionBean breakBean=(ExceptionBean)exceptionExcep.get(j);
					Calendar endRange = Calendar.getInstance();
					endRange.setTime(forecastSchedualBean.getTime());
					endRange.add(Calendar.MINUTE, SHFConstants.FORECAST_TIME_INTERVAL);
					if ( (breakBean.getStartTime().getTime() < endRange.getTime().getTime()) 
						&& 
						(breakBean.getEndTime().getTime() > forecastSchedualBean.getTime().getTime()) ) 
						{
						double breakSum=0;
						long minus=0;
						// if not in the two conditions then breakSum = 1 (minus=0)
						if ( ( breakBean.getStartTime().getTime() > forecastSchedualBean.getTime().getTime()) ) {
							minus = breakBean.getStartTime().getTime() - forecastSchedualBean.getTime().getTime();
						}
						if ( endRange.getTime().getTime() > breakBean.getEndTime().getTime() ){
							minus = minus + (endRange.getTime().getTime() - breakBean.getEndTime().getTime());
						}
						breakSum = (SHFConstants.FORECAST_TIME_INTERVAL - minus/60000) * SHFConstants.FORECAST_CALC;
						sum=sum+breakSum;
					}
				}
			}
			forecastSchedualBean.setExceptionsWFM(sum);
		}
	}
	private void setExceptionDataSHF(Vector result) throws ShfException {
		// Yuval Ovadia
		Vector exceptionExcep = getExceptionSumDataSHF();
		ForecastSchedualBean forecastSchedualBean = new ForecastSchedualBean();
		Vector<String> exceptionDetails = new Vector<String>();
		Vector<ExceptionSearchBean> beanExceptionDetails = new Vector<ExceptionSearchBean>();
		
		for(int i=0;i<result.size();i++) {
			forecastSchedualBean=(ForecastSchedualBean)result.get(i);
			double sum=0;
			exceptionDetails = new Vector();
			if (exceptionExcep!=null) {
				for (int j=0;j<exceptionExcep.size();j++) {
					//check if the shift is in the range for calculate data
					ExceptionSearchBean breakBean=(ExceptionSearchBean)exceptionExcep.get(j);
					Calendar endRange = Calendar.getInstance();
					endRange.setTime(forecastSchedualBean.getTime());
					endRange.add(Calendar.MINUTE, SHFConstants.FORECAST_TIME_INTERVAL);
					if ( (breakBean.getStartTime().getTime() < endRange.getTime().getTime()) 
						&& 
						(breakBean.getEndTime().getTime() > forecastSchedualBean.getTime().getTime()) ) 
						{
						double breakSum=0;
						long minus=0;
						// if not in the two conditions then breakSum = 1 (minus=0)
						if ( ( breakBean.getStartTime().getTime() > forecastSchedualBean.getTime().getTime()) ) {
							minus = breakBean.getStartTime().getTime() - forecastSchedualBean.getTime().getTime();
						}
						if ( endRange.getTime().getTime() > breakBean.getEndTime().getTime() ){
							minus = minus + (endRange.getTime().getTime() - breakBean.getEndTime().getTime());
						}
						breakSum = (SHFConstants.FORECAST_TIME_INTERVAL - minus/60000) * SHFConstants.FORECAST_CALC;
						// Svetlana
						//sum=sum+breakSum;
						double counterWmActivityId = 0;
						if( forecastForm.getActivityList()!=null && (!"00".equals(forecastForm.getActivityList()[0]))){
							counterWmActivityId = counterWmActivityId(breakBean.getWmActivityId(),forecastForm.getActivitiesForSelect());
						}
						if(counterWmActivityId > 0){
							sum=sum + (breakSum * counterWmActivityId);
						}else{
							sum=sum+breakSum;
						}
						exceptionDetails.add("שם: " + breakBean.getFirstName() +" " + breakBean.getLastName() +  ",  צוות: " +SHFUtils.replaceNullWithEmptyString(breakBean.getOrgUnitName())+ ",  תפקיד: " + SHFUtils.replaceNullWithEmptyString(breakBean.getJobName()) + ",  שעת התחלת משמרת: " + BaseConvert.dateToString(breakBean.getShiftStart(), "HH:mm")+ ",  שעת סיום משמרת: " + BaseConvert.dateToString(breakBean.getShiftEnd(), "HH:mm") + ", סוג פעילות: " + SHFUtils.replaceNullWithEmptyString(breakBean.getExceptionTypeName()) + ",  שעת התחלת פעילות: " + BaseConvert.dateToString(breakBean.getStartTime(), "HH:mm")+ ",  שעת סיום פעילות: " + BaseConvert.dateToString(breakBean.getEndTime(), "HH:mm") );
						beanExceptionDetails.add(breakBean);
					}
				}
			}
			forecastSchedualBean.setExceptionsSHF(sum);
			forecastSchedualBean.setExceptionsSHFDetails(exceptionDetails);
			forecastSchedualBean.setExceptionsSHFDetailsBean(beanExceptionDetails);
		}
		
//		int hh=0;
	}
	private Vector getBreaksSumDataWFM() throws ShfException{
		//get all the breaks as they come from WFM
		//TODO SCH - change to  SHF_EMPLOYEE_EXCEPTIONS_BASE
		Vector vector=null;
		StringBuffer sql=new StringBuffer();
		
		sql.append("SELECT A.*, ");
		sql.append("B.FIRST_NAME,  ");
		sql.append("B.LAST_NAME,  ");
		sql.append("B.EMPLOYEE_ID, ");
		sql.append("B.ORG_UNIT_ID  ");
		sql.append("FROM SHIFTER.SHF_EMPLOYEE_EXCEPTIONS_BASE A  ");
		sql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEE_DAY C ON C.SHF_EMPLOYEE_DAY_ID = A.AGENT_DAY_ID  ");
//		sql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES E ON E.SHF_EMPLOYEE_DAY_ID=A.AGENT_DAY_ID  ");
		sql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES B ON SUBSTR(B.EMP_ID_NUMBER,1,8) = C.EMP_ID_NUMBER ");
//		sql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES B ON SUBSTR(B.EMP_ID_NUMBER,1,8) = NVL(E.NEW_EMPLOYEE_ID,C.EMP_ID_NUMBER) ");				
		sql.append("LEFT JOIN SHIFTER.SHF_ORG_UNIT D ON D.ORG_UNIT_ID = B.ORG_UNIT_ID ");
		sql.append("WHERE B.EMPLOYEE_ID IS NOT NULL ");
		sql.append("AND A.STATE_TYPE  = ?  ");
		sql.append("AND   A.START_TIME BETWEEN ( ? ) AND ( ? ) ");
		
		// Svetlana SHF_EMPLOYEE_DAY.WM_SCH_ACTIVITY_ID_DATA ( example - 1205;1173;1175;1610;1625;) for 5 times
		//sql.append("AND replace(C.WM_SCH_ACTIVITY_ID_DATA,';','') in ( " + forecastForm.getActivitiesForSelect() + " ) ");
		sql.append("AND ( ");
		sql.append(" ( INSTR(C.WM_SCH_ACTIVITY_ID_DATA,';',1,1) = 0 AND ( replace(C.WM_SCH_ACTIVITY_ID_DATA,';','') in ( " + forecastForm.getActivitiesForSelect() + " ) ) ) ");
		sql.append(" OR SUBSTR(C.WM_SCH_ACTIVITY_ID_DATA, 1 ,INSTR(C.WM_SCH_ACTIVITY_ID_DATA,';',1,1)-1) in ( " + forecastForm.getActivitiesForSelect() + " ) "); 
		int j = 2;
		for(int i = 1; i < 5; i++ ){
			sql.append("OR ( INSTR(C.WM_SCH_ACTIVITY_ID_DATA,';',1," + j + ") > 0 AND SUBSTR(C.WM_SCH_ACTIVITY_ID_DATA, INSTR(C.WM_SCH_ACTIVITY_ID_DATA,';',1," + i + ")+1, INSTR(C.WM_SCH_ACTIVITY_ID_DATA,';',1," + j + ") - INSTR(C.WM_SCH_ACTIVITY_ID_DATA,';',1," + i + ") - 1) in ( " + forecastForm.getActivitiesForSelect() + " ) ) ");
			j++;
		}
		sql.append("    ) ");
		
		if (forecastForm.getRbChoice().equals("moked")) {
			sql.append("AND d.PARENT_UNIT = ? ");
		}	
		if (forecastForm.getRbChoice().equals("team")) {
			sql.append("and b.ORG_UNIT_ID = ? ");
		}
		
		// Svetlana
		if( ((ForecastForm)forecastForm).getInnerJobList()!=null && (!"00".equals(((ForecastForm)forecastForm).getInnerJobList()[0]))){
			sql.append("AND B.INNER_JOB_ID in (");
			String[] array = ((ForecastForm)forecastForm).getInnerJobList();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")");
		}
		
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(param++,SHFConstants.STATE_BREAK);
			db.setTimestamp(param++,dateFromAll);
			db.setTimestamp(param++,dateToAll);
			if (forecastForm.getRbChoice().equals("moked")) {
				db.setString(param++,forecastForm.getMoked());
			}
			if (forecastForm.getRbChoice().equals("team")) {
				db.setString(param++, forecastForm.getTeam());
			}
			db.executeQuery();
			vector=new Vector();
			db.populate("bzq.shf.bean.ExceptionBean", vector);
			
		}catch (DBQueryNoRowsException e) {
			
		}catch (DBException e) {
			e.printStackTrace();
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				e.printStackTrace();
			}
		}
		return vector;
	}
	
	private Vector getBreaksSumDataSHF() throws ShfException{
		//get all the breaks as they come from SHF
		Vector vector=null;
		StringBuffer sql=new StringBuffer();
		
		sql.append("SELECT A.*, ");
		sql.append("B.FIRST_NAME,  ");
		sql.append("B.LAST_NAME,  ");
		sql.append("B.EMPLOYEE_ID, ");
		sql.append("B.ORG_UNIT_ID,  ");
		// Svetlana
		sql.append("C.WM_SCH_ACTIVITY_ID_DATA  ");
		
		sql.append("FROM SHIFTER.SHF_EMPLOYEE_EXCEPTIONS A  ");
		sql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEE_DAY C ON C.SHF_EMPLOYEE_DAY_ID = A.AGENT_DAY_ID  ");
		sql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES E ON E.shf_employee_day_id = A.AGENT_DAY_ID  ");
		sql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES B ON SUBSTR(B.EMP_ID_NUMBER,1,8) = NVL(E.NEW_EMPLOYEE_ID,C.EMP_ID_NUMBER) ");
		sql.append("LEFT JOIN SHIFTER.SHF_ORG_UNIT D ON D.ORG_UNIT_ID = B.ORG_UNIT_ID ");
		sql.append("WHERE B.EMPLOYEE_ID IS NOT NULL ");
		sql.append("AND A.STATE_TYPE  = ?  ");
		sql.append("AND   A.START_TIME BETWEEN ( ? ) AND ( ? ) ");
		
		// Svetlana SHF_EMPLOYEE_DAY.WM_SCH_ACTIVITY_ID_DATA ( example - 1205;1173;1175;1610;1625;) for 5 times
		//sql.append("AND replace(C.WM_SCH_ACTIVITY_ID_DATA,';','') in ( " + forecastForm.getActivitiesForSelect() + " ) ");
		sql.append("AND ( ");
		sql.append(" ( INSTR(C.WM_SCH_ACTIVITY_ID_DATA,';',1,1) = 0 AND ( replace(C.WM_SCH_ACTIVITY_ID_DATA,';','') in ( " + forecastForm.getActivitiesForSelect() + " ) ) ) ");
		sql.append(" OR SUBSTR(C.WM_SCH_ACTIVITY_ID_DATA, 1 ,INSTR(C.WM_SCH_ACTIVITY_ID_DATA,';',1,1)-1) in ( " + forecastForm.getActivitiesForSelect() + " ) "); 
		int j = 2;
		for(int i = 1; i < 5; i++ ){
			sql.append("OR ( INSTR(C.WM_SCH_ACTIVITY_ID_DATA,';',1," + j + ") > 0 AND SUBSTR(C.WM_SCH_ACTIVITY_ID_DATA, INSTR(C.WM_SCH_ACTIVITY_ID_DATA,';',1," + i + ")+1, INSTR(C.WM_SCH_ACTIVITY_ID_DATA,';',1," + j + ") - INSTR(C.WM_SCH_ACTIVITY_ID_DATA,';',1," + i + ") - 1) in ( " + forecastForm.getActivitiesForSelect() + " ) ) ");
			j++;
		}
		sql.append("    ) ");
				
		if (forecastForm.getRbChoice().equals("moked")) {
			sql.append("AND d.PARENT_UNIT = ? ");
		}
		if (forecastForm.getRbChoice().equals("team")) {
			sql.append("and b.ORG_UNIT_ID = ? ");
		}
		
		// Svetlana
		if( ((ForecastForm)forecastForm).getInnerJobList()!=null && (!"00".equals(((ForecastForm)forecastForm).getInnerJobList()[0]))){
			sql.append("AND B.INNER_JOB_ID in (");
			String[] array = ((ForecastForm)forecastForm).getInnerJobList();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")");
		}
		
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(param++,SHFConstants.STATE_BREAK);
			db.setTimestamp(param++,dateFromAll);
			db.setTimestamp(param++,dateToAll);
			if (forecastForm.getRbChoice().equals("moked")) {
				db.setString(param++,forecastForm.getMoked());
			}
			if (forecastForm.getRbChoice().equals("team")) {
				db.setString(param++, forecastForm.getTeam());
			}
			db.executeQuery();
			vector=new Vector();
			db.populate("bzq.shf.bean.ExceptionBean", vector);
			
		}catch (DBQueryNoRowsException e) {
		}catch (DBException e) {
			e.printStackTrace();
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				e.printStackTrace();
			}
		}
		if(vector != null && vector.size() > 0){
		}
		return vector;
	}
	
	private Vector getExceptionSumDataWFM() throws ShfException{
		//get all the breaks as they come from WFM
		Vector vector=null;
		StringBuffer sql=new StringBuffer();
		
		sql.append("SELECT A.*, ");
		sql.append("B.FIRST_NAME,  ");
		sql.append("B.LAST_NAME,  ");
		sql.append("B.EMPLOYEE_ID, ");
		sql.append("B.ORG_UNIT_ID  ");
		sql.append("FROM SHIFTER.SHF_EMPLOYEE_EXCEPTIONS_BASE A  ");
		sql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEE_DAY C ON C.SHF_EMPLOYEE_DAY_ID = A.AGENT_DAY_ID  ");
//		sql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES E ON E.SHF_EMPLOYEE_DAY_ID=A.AGENT_DAY_ID  ");
		sql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES B ON SUBSTR(B.EMP_ID_NUMBER,1,8) = C.EMP_ID_NUMBER ");
		sql.append("LEFT JOIN SHIFTER.SHF_ORG_UNIT D ON D.ORG_UNIT_ID = B.ORG_UNIT_ID ");
		sql.append("WHERE B.EMPLOYEE_ID IS NOT NULL ");
		sql.append("AND A.STATE_TYPE  <> ?  ");
		sql.append("AND A.STATE_TYPE  > ? "); 
		sql.append("AND A.CANCEL_REASON_CODE IS NULL ");
		sql.append("AND A.START_TIME BETWEEN ( ? ) AND ( ? ) ");
		//sql.append("AND replace(C.WM_SCH_ACTIVITY_ID_DATA,';','') in ( " + forecastForm.getActivitiesForSelect() + " ) "); 
		if (forecastForm.getRbChoice().equals("moked")) {
			sql.append("AND A.EXCEPTION_TYPE in ( " + forecastForm.getExceptionsForSelect()+ " ) ");
			sql.append("AND d.PARENT_UNIT = ? ");
		}	
		if (forecastForm.getRbChoice().equals("team")) {
			sql.append("and b.ORG_UNIT_ID = ? ");
		}
		
		// Svetlana
		if( ((ForecastForm)forecastForm).getInnerJobList()!=null && (!"00".equals(((ForecastForm)forecastForm).getInnerJobList()[0]))){
			sql.append("AND B.INNER_JOB_ID in (");
			String[] array = ((ForecastForm)forecastForm).getInnerJobList();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")");
		}
		
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(param++,SHFConstants.STATE_BREAK);
			db.setInt(param++,0);
			db.setTimestamp(param++,dateFromAll);
			db.setTimestamp(param++,dateToAll);
			if (forecastForm.getRbChoice().equals("moked")) {
				db.setString(param++,forecastForm.getMoked());
			}
			if (forecastForm.getRbChoice().equals("team")) {
				db.setString(param++, forecastForm.getTeam());
			}
			db.executeQuery();
			vector=new Vector();
			db.populate("bzq.shf.bean.ExceptionBean", vector);
			
		}catch (DBQueryNoRowsException e) {
			
		}catch (DBException e) {
			e.printStackTrace();
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				e.printStackTrace();
			}
		}
		return vector;
	}
	
	private Vector getExceptionSumDataSHF() throws ShfException{
		//get all the breaks as they come from SHF
		Vector<ExceptionSearchBean> vector=null;
		StringBuffer sql=new StringBuffer();
		
		sql.append("SELECT A.*, ");
		sql.append("B.FIRST_NAME,  ");
		sql.append("B.LAST_NAME,  ");
		sql.append("B.EMPLOYEE_ID, ");
		sql.append("B.ORG_UNIT_ID, ");
		sql.append("C.WM_SHIFT_START_DATETIME, ");
		sql.append("C.WM_SHIFT_END_DATETIME, ");
		
		// Svetlana
		sql.append("C.WM_SCH_ACTIVITY_ID_DATA,  ");
		
		sql.append("E.NEW_SHIFT_START, ");
		sql.append("E.NEW_SHIFT_END, ");
		sql.append("D.ORG_UNIT_NAME, ");
		sql.append("X.EXCEPTION_TYPE_NAME ");
		sql.append("FROM SHIFTER.SHF_EMPLOYEE_EXCEPTIONS A  ");
		sql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEE_DAY C ON C.SHF_EMPLOYEE_DAY_ID = A.AGENT_DAY_ID  ");
		sql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES E ON E.shf_employee_day_id=A.AGENT_DAY_ID  ");
		sql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES B ON SUBSTR(B.EMP_ID_NUMBER,1,8) = NVL(E.NEW_EMPLOYEE_ID,C.EMP_ID_NUMBER) ");
		sql.append("LEFT JOIN SHIFTER.SHF_ORG_UNIT D ON D.ORG_UNIT_ID = B.ORG_UNIT_ID ");
		sql.append("LEFT JOIN SHIFTER.SHF_EXCEPTION_TYPE X ON X.EXCEPTION_TYPE_ID = A.EXCEPTION_TYPE ");
		sql.append("WHERE B.EMPLOYEE_ID IS NOT NULL ");
		sql.append("AND A.STATE_TYPE  <> ?  ");
		sql.append("AND A.STATE_TYPE  > ? "); 
		sql.append("AND A.CANCEL_REASON_CODE IS NULL ");
		sql.append("AND A.START_TIME BETWEEN ( ? ) AND ( ? ) ");
		//sql.append("AND replace(C.WM_SCH_ACTIVITY_ID_DATA,';','') in ( " + forecastForm.getActivitiesForSelect() + " ) "); 
		if (forecastForm.getRbChoice().equals("moked")) {
			sql.append("AND A.EXCEPTION_TYPE in ( " + forecastForm.getExceptionsForSelect()+ " ) ");
			sql.append("AND d.PARENT_UNIT = ? ");
		}
		if (forecastForm.getRbChoice().equals("team")) {
			sql.append("and b.ORG_UNIT_ID = ? ");
		}
		
		// Svetlana
		if( ((ForecastForm)forecastForm).getInnerJobList()!=null && (!"00".equals(((ForecastForm)forecastForm).getInnerJobList()[0]))){
			sql.append("AND B.INNER_JOB_ID in (");
			String[] array = ((ForecastForm)forecastForm).getInnerJobList();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")");
		}
		
		sql.append(" ORDER BY B.FIRST_NAME, B.LAST_NAME ");
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(param++,SHFConstants.STATE_BREAK);
			db.setInt(param++,0);
			db.setTimestamp(param++,dateFromAll);
			db.setTimestamp(param++,dateToAll);
			if (forecastForm.getRbChoice().equals("moked")) {
				db.setString(param++,forecastForm.getMoked());
			}
			if (forecastForm.getRbChoice().equals("team")) {
				db.setString(param++, forecastForm.getTeam());
			}
			db.executeQuery();
			
			vector=new Vector();
			db.populate("bzq.shf.bean.ExceptionSearchBean", vector);
			if (vector != null){
				for (ExceptionSearchBean exc : vector){
//					System.out.println("exc day id: "+exc.getAgentDayId());
				}
			}
				
			
			
			
		}catch (DBQueryNoRowsException e) {
//			System.out.println("exc db is null");
		}catch (DBException e) {
			e.printStackTrace();
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				e.printStackTrace();
			}
		}

		return vector;
	}
	private void setShebotsWFM(Vector result){
		//yuval Ovadia
		//get the result for SHIBUTZ for MOKED
		Vector shifts=getShiftsSumDataWFM();
		ForecastSchedualBean forecastSchedualBean = new ForecastSchedualBean();
		for(int i=0;i<result.size();i++) {
			forecastSchedualBean=(ForecastSchedualBean)result.get(i);
			int sum=0;
			if (shifts!=null) {
				for (int j=0;j<shifts.size();j++) {
					//check if the shift is in the range for calculate data
					AgentDayBean day=(AgentDayBean)shifts.get(j);
					Calendar endRange = Calendar.getInstance();
					endRange.setTime(forecastSchedualBean.getTime());
					endRange.add(Calendar.MINUTE, 15); // add 15 min
					if ( (day.getShiftStart().getTime() < endRange.getTime().getTime()) 
						&& 
						(day.getShiftEnd().getTime() > forecastSchedualBean.getTime().getTime()) ) 
						{
						sum++;
					}
				}
			}
			forecastSchedualBean.setShebotsMoked(sum);
		}
	}
	
	/**
	 * Counter of activities for employee
	 * @param String
	 * @return int
	 * "1171;1172;1605; -> 3"
	 */
	private double counterWmActivityId(String wmActivityId, String activities){
	    
		double counterWmActivityId = 0;
		double counterActivityId = 0;
		double counterActivities = 0;
		if(!GenericValidator.isBlankOrNull(activities) && !GenericValidator.isBlankOrNull(wmActivityId)){
			StringTokenizer st=new StringTokenizer(wmActivityId,";");
			if(!st.hasMoreTokens()) 
				return counterWmActivityId;
			while(st.hasMoreTokens()){
				++counterActivities;
				String activityId=st.nextToken();
				int i = activities.indexOf(activityId);	
				if(i == 0 || i > 0)
					++counterActivityId; 
			}		
			counterWmActivityId = counterActivityId / counterActivities;
		}
		
		return counterWmActivityId;
	}
	
	private void setShebotsData(ForecastSchedualBean forecastSchedualBean){
		Vector shifts=getShiftsSumDataBeforeChange(forecastSchedualBean);
		forecastSchedualBean.setShebotsMoked(shifts!=null?shifts.size():0);
	}
	
	private void setShebotsSHF(Vector result){
//		System.out.println("in setShebotsSHF");
		//Yuval Ovadia
		ForecastSchedualBean forecastSchedualBean = new ForecastSchedualBean();		
		Vector <AgentDayBean> shifts = getShiftsSumDataSHF();
		Vector arrivalsDetails = new Vector();
		Vector futureExitDetails = new Vector();
		Vector cancelDetails = new Vector();
		Vector extraDetails = new Vector();
//		Vector <EventReasonForm> shiftCancelReasons = new Vector<EventReasonForm>();
//		TablesContainer tablesContainer = AppResources.getInstance().getTablesContainer();
//		Vector <EventReasonForm> eventReasonTableVec = tablesContainer.getTable(TablesConstants.EVENT_REASON_TABLE);
//		if (eventReasonTableVec != null){
//			for(EventReasonForm reason :  eventReasonTableVec){
//				if(reason.getType() == SHFConstants.CANCEL_SHIFT && Integer.parseInt(reason.getCode()) != SHFConstants.CANCEL_OF_SWITCH ){ // not including cancel because switch
////					System.out.println("cancel reason: "+reason.getCode());
//					shiftCancelReasons.add(reason);
//				}
//			}
//		}else{
//			shiftCancelReasons = null;
//		}
		
		
		
		for(int i=0;i<result.size();i++) {
//			System.out.println("time : "+BaseConvert.dateToString(forecastSchedualBean.getTime(), "HH:mm"));	

			forecastSchedualBean=(ForecastSchedualBean)result.get(i);
			arrivalsDetails = new Vector();
			futureExitDetails = new Vector();
//			cancelDetails = new Vector();
			extraDetails= new Vector();
			if (shifts!=null) {
				for (int j=0;j<shifts.size();j++) {
					AgentDayBean day=(AgentDayBean)shifts.get(j);
//					System.out.println("day id: "+day.getAgentDayId());
					Calendar endRange = Calendar.getInstance();
					Calendar futureEndRange = Calendar.getInstance();
					Calendar futureStartRange = Calendar.getInstance();
					endRange.setTime(forecastSchedualBean.getTime());
					endRange.add(Calendar.MINUTE, 15);
					
					futureStartRange.setTime(endRange.getTime());
					futureEndRange.setTime(endRange.getTime());
					futureEndRange.add(Calendar.MINUTE, 15);
					
					// Svetlana
					double counterWmActivityId = 0;
					if( forecastForm.getActivityList()!=null && (!"00".equals(forecastForm.getActivityList()[0]))){
						counterWmActivityId = counterWmActivityId(day.getWmActivityId(),forecastForm.getActivitiesForSelect());
					}
					//check for future arrivals מגיעים
					if ((day.getShiftStart().getTime() >= futureStartRange.getTime().getTime()) // 
					        &&
					    (day.getShiftStart().getTime() < futureEndRange.getTime().getTime()  ))
					{
						// Svetlana
						// forecastSchedualBean.setArrivals(forecastSchedualBean.getArrivals()+1);
						
						if (counterWmActivityId > 0){
							forecastSchedualBean.setArrivals(forecastSchedualBean.getArrivals() + counterWmActivityId);
						}else{
							forecastSchedualBean.setArrivals(forecastSchedualBean.getArrivals()+1);
						}	
						
						//tamar-9604
						//arrivalsDetails.add(day.getFirstName().trim() +  " " + day.getLastName().trim());
						
						arrivalsDetails.add(day);
						
						//tamar-9604
					}
					
					//check for exit יוצאים
					if ((day.getShiftEnd().getTime() >= forecastSchedualBean.getTime().getTime()) // 
					        &&
					    (day.getShiftEnd().getTime() < endRange.getTime().getTime()  ))
					{
						// Svetlana
						// forecastSchedualBean.setFutureExit(forecastSchedualBean.getFutureExit()+1);
						if (counterWmActivityId > 0){
							forecastSchedualBean.setFutureExit(forecastSchedualBean.getFutureExit() + counterWmActivityId);
						}else{
							forecastSchedualBean.setFutureExit(forecastSchedualBean.getFutureExit()+1);
						}	
						
						//tamar-9604
						//futureExitDetails.add(day.getFirstName().trim() +  " " + day.getLastName().trim());
						futureExitDetails.add(day);
						//tamar-9604
					}
//					System.out.println("start: "+day.getShiftStart()+" ; end: "+day.getShiftEnd());
					//TODO - sch - check for the equal sign 
					if ( ( day.getShiftStart().getTime() < endRange.getTime().getTime()) 
						&& 
						( day.getShiftEnd().getTime()) > forecastSchedualBean.getTime().getTime() ) //check the range
					{
						//shifts after changes
						//TODO - sch - check what about the cancel shifts 
						// Svetlana
						//forecastSchedualBean.setAfterChanges(forecastSchedualBean.getAfterChanges()+1);
						if (counterWmActivityId > 0){
							forecastSchedualBean.setAfterChanges(forecastSchedualBean.getAfterChanges() + counterWmActivityId);
//							System.out.println("adding after changes + counterWmActivityId(="+counterWmActivityId+") , current bean:" + forecastSchedualBean.getTime()+", current value(after adding):"+forecastSchedualBean.getAfterChanges());
						}else{
							forecastSchedualBean.setAfterChanges(forecastSchedualBean.getAfterChanges()+1);
//							System.out.println("adding after changes !, current bean:" + forecastSchedualBean.getTime()+", current value(after adding):"+forecastSchedualBean.getAfterChanges());
						}	

						//inforce after changes מתגברים new Igal 7.2013 added conditions " ! (day.getMissingReasonId() > 0) and day.getCancelReasonCode() == null"
						
						if( day.getWfmAgendDayId() == 0 && ! (day.getMissingReasonId() > 0) )
						{
							if(day.getCancelReasonCode() == null){
							// Svetlana
							//forecastSchedualBean.setInExtraHours(forecastSchedualBean.getInExtraHours()+1);
							if ( counterWmActivityId > 0 ){
								forecastSchedualBean.setInExtraHours(forecastSchedualBean.getInExtraHours() + counterWmActivityId);
							}else{
								forecastSchedualBean.setInExtraHours(forecastSchedualBean.getInExtraHours()+1);
							}	
							extraDetails.add(day);
							}
						}

							//check if the shifts has been canceled מצמצמים new Igal 7.2013 
//						System.out.println(day.getAgentDayId());
//						if (day.getCancelReasonCode() != null){
//							System.out.println("CancelReasonCode: "+ day.getCancelReasonCode());	
//						}else{
//							System.out.println("CancelReasonCode is NULL");
//						}
////						System.out.println("MissingReasonId: "+day.getMissingReasonId());
//						if( day.getCancelReasonCode() != null || day.getMissingReasonId() == SHFConstants.SHIFT_REDUCE_BY_STAGE)
//						{ 
//							if (day.getCancelReasonCode() != null){
//								Boolean shiftCanceled = false; 
//								for (EventReasonForm reason : shiftCancelReasons){ // if reason is a cancel reason from shifts screen
//									System.out.println("reason id: "+reason.getCode()+", day cancel code: "+day.getCancelReasonCode());
//									if ( Integer.parseInt(day.getCancelReasonCode()) == Integer.parseInt(reason.getCode()) ){
//										shiftCanceled = true;
//										break;
//										}
//								} // END FOR
//								if(shiftCanceled){
//										// Svetlana
//										//forecastSchedualBean.setCancelled(forecastSchedualBean.getCancelled()+1);
//										if (counterWmActivityId > 0){
//											forecastSchedualBean.setCancelled(forecastSchedualBean.getCancelled() + counterWmActivityId);
//										}else{
//											forecastSchedualBean.setCancelled(forecastSchedualBean.getCancelled()+1);
//										}
//										System.out.println("cancel adding id: "+day.getAgentDayId());
//										cancelDetails.add(day);
//									}
//							}else{ // or shift reduced by stage from attendance screen 
//								if (counterWmActivityId > 0){
//									forecastSchedualBean.setCancelled(forecastSchedualBean.getCancelled() + counterWmActivityId);
//								}else{
//									forecastSchedualBean.setCancelled(forecastSchedualBean.getCancelled()+1);
//								}
//								System.out.println("reduce adding id: "+day.getAgentDayId());
//								cancelDetails.add(day); 
//							} 
//						}
						// old code Igal 7.2013
//						if( day.getCancelReasonCode() != null)
//						{
//							if( Integer.parseInt(day.getCancelReasonCode()) != SHFConstants.CANCEL_OF_SWITCH )
//							{ 
//								// Svetlana
//								//forecastSchedualBean.setCancelled(forecastSchedualBean.getCancelled()+1);
//								if (counterWmActivityId > 0){
//									forecastSchedualBean.setCancelled(forecastSchedualBean.getCancelled() + counterWmActivityId);
//								}else{
//									forecastSchedualBean.setCancelled(forecastSchedualBean.getCancelled()+1);
//								}	
//								
//								cancelDetails.add(day);
//							}
//						}
					}
				}
			}
			forecastSchedualBean.setArrivalsDetails(arrivalsDetails);
			forecastSchedualBean.setFutureExitDetails(futureExitDetails);
			forecastSchedualBean.setCancelDetails(cancelDetails);
			forecastSchedualBean.setExtraDetails(extraDetails);
		}
	}

	private void setCanceledData(Vector result){
		logger.debug("Starting setCanceledData()");

		//Yuval Ovadia
		ForecastSchedualBean forecastSchedualBean = new ForecastSchedualBean();		
		Vector shifts = getShiftsCalncelledSHF();
		Vector cancelDetails = new Vector();
		Vector <EventReasonForm> shiftCancelReasons = new Vector<EventReasonForm>();
		TablesContainer tablesContainer = AppResources.getInstance().getTablesContainer();
		Vector <EventReasonForm> eventReasonTableVec = tablesContainer.getTable(TablesConstants.EVENT_REASON_TABLE);
		if (eventReasonTableVec != null){
			for(EventReasonForm reason :  eventReasonTableVec){
				if(reason.getType() == SHFConstants.CANCEL_SHIFT && Integer.parseInt(reason.getCode()) != SHFConstants.CANCEL_OF_SWITCH ){ // not including cancel because switch
					shiftCancelReasons.add(reason);
				}
			}
		}
		
		for(int i=0;i<result.size();i++) {
			forecastSchedualBean=(ForecastSchedualBean)result.get(i);
			if (shifts!=null) {
				for (int j=0;j<shifts.size();j++) {
					// Svetlana
					//forecastSchedualBean.setCancelled(forecastSchedualBean.getCancelled()+1);
					
					AgentDayBean day=(AgentDayBean)shifts.get(j);
					double counterWmActivityId = 0;
					if( forecastForm.getActivityList()!=null && (!"00".equals(forecastForm.getActivityList()[0]))){
						counterWmActivityId = counterWmActivityId(day.getWmActivityId(),forecastForm.getActivitiesForSelect());
					}
					Calendar endRange = Calendar.getInstance();
					endRange.setTime(forecastSchedualBean.getTime());
					endRange.add(Calendar.MINUTE, 15);
					cancelDetails = new Vector();
					if ( ( day.getShiftStart().getTime() < endRange.getTime().getTime()) 
						&& 
						( day.getShiftEnd().getTime()) > forecastSchedualBean.getTime().getTime() )
					{
//						System.out.println("MissingReasonId: "+day.getMissingReasonId());
						if( day.getCancelReasonCode() != null || day.getMissingReasonId() == SHFConstants.SHIFT_REDUCE_BY_STAGE)
						{ 
							if (day.getCancelReasonCode() != null){
								Boolean shiftCanceled = false; 
								for (EventReasonForm reason : shiftCancelReasons){ // if cancel reason is a reason from shifts screen
									if ( day.getCancelReasonCode().equals(reason.getCode()) ){
										shiftCanceled = true;
										break;
										}
								} // END FOR
								if(shiftCanceled){
										// Svetlana
										
										if (counterWmActivityId > 0){
											forecastSchedualBean.setCancelled(forecastSchedualBean.getCancelled() + counterWmActivityId);
										}else{
											forecastSchedualBean.setCancelled(forecastSchedualBean.getCancelled()+1);
										}
										cancelDetails.add(day);
									}
							}else{ // or shift reduced by stage from attendance screen 
								if (counterWmActivityId > 0){
									forecastSchedualBean.setCancelled(forecastSchedualBean.getCancelled() + counterWmActivityId);
								}else{
									forecastSchedualBean.setCancelled(forecastSchedualBean.getCancelled()+1);
								}
								cancelDetails.add(day); 
							} 
						}
					}
				}
			}else{
//				System.out.println("cancel shifts is NULL");
			}
			forecastSchedualBean.setCancelDetails(cancelDetails);
		}
	}
	private void setShebotsChangesData(ForecastSchedualBean forecastSchedualBean){
		Vector shifts=getShiftsSumDataAfterChange(forecastSchedualBean);
		forecastSchedualBean.setAfterChanges(shifts!=null?shifts.size():0);
		double extra=0;
		if(shifts!=null && shifts.size()>0){
			for(int i=0;i<shifts.size();i++){
				AgentDayBean day=(AgentDayBean)shifts.get(i);
				if(day.getWfmAgendDayId()==0){ 
					// Svetlana
					//extra++;
					double counterWmActivityId = 0;
					if( forecastForm.getActivityList()!=null && (!"00".equals(forecastForm.getActivityList()[0]))){
						counterWmActivityId = counterWmActivityId(day.getWmActivityId(),forecastForm.getActivitiesForSelect());
					}
					if (counterWmActivityId > 0){
						extra = extra + counterWmActivityId;
					}else{
						extra++;
					}	
					
				}
			}
		}
		forecastSchedualBean.setInExtraHours(extra);
	}
	
	private void setArrivalsDataNew(Vector result){
		//Yuval Ovadia
		ForecastSchedualBean forecastSchedualBean = new ForecastSchedualBean();
		Vector missingDetails = new Vector();
		Vector lateDetails = new Vector();
		Vector markedDetails = new Vector();
		Vector shorteningDetails = new Vector();
		Vector shiftingDetails = new Vector();
		Vector extensionDetails = new Vector();
		
		Date currentDate = new Date();
		Vector shifts = getShiftsDataNew();
		
		for(int i=0;i<result.size();i++) {
			forecastSchedualBean=(ForecastSchedualBean)result.get(i); // every bean already set to 15 min interval
			int shiftsForTime=0;
			missingDetails = new Vector();
			lateDetails = new Vector();
			markedDetails = new Vector();
			shorteningDetails = new Vector();
			shiftingDetails = new Vector();
			extensionDetails = new Vector();
			if(forecastSchedualBean.getCancelDetails()!=null){
				forecastSchedualBean.getCancelDetails();
			}
			Vector <ExceptionSearchBean> allExceptions = forecastSchedualBean.getExceptionsSHFDetailsBean(); // get exceptions for current 15 min, populated before via setExceptionDataSHF()
//			System.out.println("time : "+BaseConvert.dateToString(forecastSchedualBean.getTime(), "HH:mm"));	
			if (shifts!=null) {
				for (int j=0;j<shifts.size();j++) {
					AgentDayBean day=(AgentDayBean)shifts.get(j);
					Calendar endRange = Calendar.getInstance();
					endRange.setTime(forecastSchedualBean.getTime());
					endRange.add(Calendar.MINUTE, 15);
					//tamar-9604
					Calendar startShift=Calendar.getInstance();
					Calendar newStartShift=Calendar.getInstance();
					Calendar endShift=Calendar.getInstance();
					Calendar newEndShift=Calendar.getInstance();
					startShift.setTime(day.getWmShiftStartTime());
					Calendar lateForMarked=Calendar.getInstance();
					long shiftStartSec=0,shiftNewStartSec=0,shiftEndSec=0 ,shiftNewEndSec=0,dif=0,difNew=0;
					
					// Svetlana
					double counterWmActivityId = 0;
					if( forecastForm.getActivityList()!=null && (!"00".equals(forecastForm.getActivityList()[0]))){
						counterWmActivityId = counterWmActivityId(day.getWmActivityId(),forecastForm.getActivitiesForSelect());
					}
					
					if (day.getNewShiftStart()!=null){
						lateForMarked.setTime(day.getNewShiftStart());
					}else{	
						lateForMarked.setTime(day.getShiftStart());
					}
					if (day.getStageLateMinutes()!=0){
					   lateForMarked.add(Calendar.MINUTE, day.getStageLateMinutes());
					}   
					if (day.getNewShiftStart()!=null){
						newStartShift.setTime(day.getNewShiftStart());
						 shiftNewStartSec=newStartShift.getTimeInMillis();
					}
					endShift.setTime(day.getWmShiftEndTime());
					if (day.getNewShiftEnd()!= null){
						newEndShift.setTime(day.getNewShiftEnd());

						shiftNewEndSec=newEndShift.getTimeInMillis();
						}
					shiftStartSec=startShift.getTimeInMillis();
					shiftEndSec=endShift.getTimeInMillis();
					
					dif=shiftEndSec-shiftStartSec;
					difNew=shiftNewEndSec-shiftNewStartSec;
					
					// מקצרים
					if ( (day.getNewShiftStart()!=null && forecastSchedualBean.getTime().getTime() <= day.getNewShiftStart().getTime() ) 
							&& 
					     (day.getNewShiftStart().getTime() < endRange.getTime().getTime()) 
					        &&
					        dif > difNew ){
						// Svetlana
						// forecastSchedualBean.setShortening(forecastSchedualBean.getShortening()+1);
						if (counterWmActivityId > 0){
							forecastSchedualBean.setShortening(forecastSchedualBean.getShortening() + counterWmActivityId);
						}else{
							forecastSchedualBean.setShortening(forecastSchedualBean.getShortening()+1);
						}	
						
						shorteningDetails.add(day);
									
					}
					
					// מאריכים
					if ( (day.getNewShiftStart()!=null && forecastSchedualBean.getTime().getTime() <= day.getNewShiftStart().getTime() ) 
							&& 
					     (day.getNewShiftStart().getTime() < endRange.getTime().getTime() ) 
					        && dif < difNew ){
						// Svetlana
						// forecastSchedualBean.setExtension(forecastSchedualBean.getExtension()+1);
						if (counterWmActivityId > 0){
							forecastSchedualBean.setExtension(forecastSchedualBean.getExtension() + counterWmActivityId);
						}else{
							forecastSchedualBean.setExtension(forecastSchedualBean.getExtension()+1);
						}	
						
						extensionDetails.add(day);
						
					}
					
					// הזזה
					if ( (day.getNewShiftStart()!=null && forecastSchedualBean.getTime().getTime() <= day.getNewShiftStart().getTime() ) 
							&& 
					     (day.getNewShiftStart().getTime() < endRange.getTime().getTime() ) 
					        && dif == difNew 
					        && day.getWmShiftStartTime().getTime() != day.getNewShiftStart().getTime()){
						// Svetlana
						// forecastSchedualBean.setShifting(forecastSchedualBean.getShifting()+1);
						if (counterWmActivityId > 0){
							forecastSchedualBean.setShifting(forecastSchedualBean.getShifting() + counterWmActivityId);
						}else{
							forecastSchedualBean.setShifting(forecastSchedualBean.getShifting()+1);
						}	
						
						shiftingDetails.add(day);
					}
										
					
					//tamar-9604  מאחרים
					if ( (day.getShiftStart().getTime() < endRange.getTime().getTime()) 
						&& 
						(day.getShiftStart().getTime() >= forecastSchedualBean.getTime().getTime())) {

						//check late shifts in current time
						if(day.getStationArrivalTime()==null && day.getStationArrivalTime()==null && day.getMissingReasonId() == 0 && day.getShiftEnd().before(currentDate)) 
						{ 
						  //Svetlana
						  //forecastSchedualBean.setLate(forecastSchedualBean.getLate()+1);
							if (counterWmActivityId > 0){
								forecastSchedualBean.setLate(forecastSchedualBean.getLate() + counterWmActivityId);
							}else{
								forecastSchedualBean.setLate(forecastSchedualBean.getLate()+1);
							}		
						  
						  //tamar-9604
						  //lateDetails.add("שם: " + day.getFirstName() +" " + day.getLastName() +  ",  מוקד: " + SHFUtils.replaceNullWithEmptyString( SHFTableUtils.getUnitName(forecastForm.getMoked()).trim().replace("'", "")) + ",  צוות: " + SHFUtils.replaceNullWithEmptyString(day.getOrgUnitName())+ ",  תור: " + SHFUtils.replaceNullWithEmptyString(SHFTableUtils.getActivityName(day.getShiftActivity())) + ",  תפקיד: " + SHFUtils.replaceNullWithEmptyString(day.getJobName()) + ",  תחילת משמרת: " + BaseConvert.dateToString(day.getShiftStart(), "dd/MM/yyyy HH:mm")+ ",  סיום משמרת: " + BaseConvert.dateToString(day.getShiftEnd(), "dd/MM/yyyy HH:mm") + ", סלולארי: " + SHFUtils.replaceNullWithEmptyString(day.getCellularPhone()) + ", בית: " + SHFUtils.replaceNullWithEmptyString(day.getHomePhone())+ ", הערת משמרת: " + SHFUtils.replaceNullWithEmptyString(day.getRemark()));
						  day.setAllowedMoked(forecastForm.getMoked());
//						  System.out.println("late 1 adding day id :"+day.getAgentDayId()+", agent id : "+day.getEmpIdNumber());
						  lateDetails.add(day);
						  
						  //tamar-9604
						  
						}
						
//ORIGINAL Late data						
//						if(day.getStageLateMinutes()>0)
//							{ late++; }
						
//						if (day.getMissingReasonId()==81) {
//							forecastSchedualBean.setCancelled(forecastSchedualBean.getCancelled()+1);
//						}
						shiftsForTime++;
					}
					
					//check for Missing
					if ( (forecastSchedualBean.getTime().getTime() >= day.getShiftStart().getTime() ) 
							&& 
					     (forecastSchedualBean.getTime().getTime() < day.getShiftEnd().getTime() ) 
					        &&
					     (day.getMissingReasonId()>0 && (day.getMissingReasonId() != SHFConstants.SHIFT_REDUCE_BY_STAGE)) ) {
						  //Svetlana
						  //forecastSchedualBean.setMissing(forecastSchedualBean.getMissing()+1);
						  	if (counterWmActivityId > 0){
								forecastSchedualBean.setMissing(forecastSchedualBean.getMissing() + counterWmActivityId);
							}else{
								forecastSchedualBean.setMissing(forecastSchedualBean.getMissing()+1);
							}	
						  //tamar-9604
						  //missingDetails.add(day.getFirstName().trim() +  " " + day.getLastName().trim());
						  missingDetails.add(day);
						  //tamar-9604
						  //check for canceled because of "tzimztum"
//						  if (day.getMissingReasonId()==81) { mute by Igal 7.2013 "tzimztum" already calculated at setCancledData()
//							// Svetlana
//							//forecastSchedualBean.setCancelled(forecastSchedualBean.getCancelled()+1);
//							if (counterWmActivityId > 0){
//								forecastSchedualBean.setCancelled(forecastSchedualBean.getCancelled() + counterWmActivityId);
//							}else{
//								forecastSchedualBean.setCancelled(forecastSchedualBean.getCancelled()+1);
//							}	  
//							
//							cancelDetails.add(day);
//						}
					}

					//check for late
					if (day.getStationArrivalTime()!=null) {
						if ( (forecastSchedualBean.getTime().getTime() >= day.getShiftStart().getTime() ) 
								&& 
						     (forecastSchedualBean.getTime().getTime() < day.getStationArrivalTime().getTime() ) 
						        &&
						     (day.getLateMinutes()>0) ) {
							  //Svetlana
							  //forecastSchedualBean.setLate(forecastSchedualBean.getLate()+1); 
								if (counterWmActivityId > 0){
									forecastSchedualBean.setLate(forecastSchedualBean.getLate() + counterWmActivityId);
								}else{
									forecastSchedualBean.setLate(forecastSchedualBean.getLate()+1);
								}								
							  
							  //lateDetails.add("שם: " + day.getFirstName() +" " + day.getLastName() +  ",  מוקד: " +SHFUtils.replaceNullWithEmptyString(SHFTableUtils.getUnitName(forecastForm.getMoked()).trim().replace("'", "")) + ",  צוות: " + SHFUtils.replaceNullWithEmptyString(day.getOrgUnitName()) + ",  תור: " +SHFTableUtils.getActivityName(day.getShiftActivity()) + ",  תפקיד: " + SHFUtils.replaceNullWithEmptyString(day.getJobName() ) + ",  תחילת משמרת: " + BaseConvert.dateToString(day.getShiftStart(), "dd/MM/yyyy HH:mm")+ ",  סיום משמרת: " + BaseConvert.dateToString(day.getShiftEnd(), "dd/MM/yyyy HH:mm") + ", סלולארי: " + SHFUtils.replaceNullWithEmptyString(day.getCellularPhone()) + ", בית: " + SHFUtils.replaceNullWithEmptyString(day.getHomePhone())+ ", הערת משמרת: " + SHFUtils.replaceNullWithEmptyString(day.getRemark()));
							  //tamae-9604
							  //day.setAllowedMoked(forecastForm.getMoked());
								
								lateDetails.add(day);
							  //tamar-9604
						}
					}
//					System.out.println("id "+day.getAgentDayId()+" site "+day.getNewSiteId()+" switch id "+day.getSwitchDayId()+" "+day.getStationArrivalTime()+" != null && " +BaseConvert.dateToString(lateForMarked.getTime(), "HH:mm")+" <= "+BaseConvert.dateToString(endRange.getTime(), "HH:mm"));
					//check for current state of shifters נוכחים
					if (day.getStationArrivalTime() != null && (lateForMarked.getTime().getTime() <= endRange.getTime().getTime())) {
							if((day.getNewShiftStart()==null) &&	
							(endRange.getTime().getTime() > day.getShiftStart().getTime()) && 
							(forecastSchedualBean.getTime().getTime() < day.getShiftEnd().getTime())
							
							||
							((day.getNewShiftStart()!=null) &&
							(endRange.getTime().getTime() > day.getNewShiftStart().getTime())&&
							(forecastSchedualBean.getTime().getTime() < day.getNewShiftEnd().getTime())))
							 
							{	
								// Svetlana
								//forecastSchedualBean.setMarked(forecastSchedualBean.getMarked()+1);
								
								
								//check for shifts that has been changed
								//tamar-9604----**********רישום כל הנוכחים
															
								//if( ( day.getNewShiftStart()!=null && (!day.getNewShiftStart().equals(day.getWmShiftStartTime())) ) 
								//		|| 
								//	( day.getNewShiftEnd()!=null && (!day.getNewShiftEnd().equals(day.getWmShiftEndTime())) ) ){
								//tamar-9604----**********רישום כל הנוכחים	
								//tamae-9604
								//arkedDetails.add("שם: " + day.getFirstName() +" " + day.getLastName() + ", תחילת משמרת מקורית:" + BaseConvert.dateToString(day.getWmShiftStartTime(), "dd/MM/yyyy HH:mm") + ", תחילת משמרת מעודכנת:" + BaseConvert.dateToString(day.getShiftStart(), "dd/MM/yyyy HH:mm")+ ",  סיום משמרת מקורית: " + BaseConvert.dateToString(day.getWmShiftEndTime(), "dd/MM/yyyy HH:mm")+ ", סיום משמרת מעודכנת: " + BaseConvert.dateToString(day.getShiftEnd(), "dd/MM/yyyy HH:mm") );
								
								//  original code Igal - exceptions not to show with attending
								//if (counterWmActivityId > 0){
								//	forecastSchedualBean.setMarked(forecastSchedualBean.getMarked() + counterWmActivityId);
								//}else{
								//	forecastSchedualBean.setMarked(forecastSchedualBean.getMarked()+1);
								//}	
								//markedDetails.add(day);
								
								boolean excExists = false;
								
								if(allExceptions != null && allExceptions.size() > 0) { // exceptions not to show with attending
									for (ExceptionSearchBean exception : allExceptions){
//										System.out.println("id: "+exception.getEmployeeId()+" exc start :"+BaseConvert.dateToString(exception.getStartTime(), "HH:mm")+" end :"+BaseConvert.dateToString(exception.getEndTime(), "HH:mm"));

										if ( day.getAgentDayId() == exception.getAgentDayId() ){ // if agent have exception
											if( ((exception.getStartTime().compareTo(forecastSchedualBean.getTime()) >=0 ) // and exception in range
													&& (exception.getStartTime().compareTo(endRange.getTime()) < 0))
												||
												((exception.getEndTime().compareTo(forecastSchedualBean.getTime()) > 0 ) 
														&& (exception.getEndTime().compareTo(endRange.getTime()) <= 0))
												||
												( (exception.getStartTime().compareTo(forecastSchedualBean.getTime()) <= 0) 
														&& (exception.getEndTime().compareTo(endRange.getTime()) >= 0))
											){
//												System.out.println("not adding id: "+exception.getEmployeeId()+" exc start :"+BaseConvert.dateToString(exception.getStartTime(), "HH:mm")+" end :"+BaseConvert.dateToString(exception.getEndTime(), "HH:mm"));
												excExists = true;
												break;
											}
										}
									}
									if ( ! excExists){ // if no relevant except. exist for agent
										if (counterWmActivityId > 0){
											forecastSchedualBean.setMarked(forecastSchedualBean.getMarked() + counterWmActivityId);
										}else{
											forecastSchedualBean.setMarked(forecastSchedualBean.getMarked()+1);
										}	
										markedDetails.add(day);
									}
								//tamae-9604
								}else{ // if there is no exceptions
									if (counterWmActivityId > 0){
										forecastSchedualBean.setMarked(forecastSchedualBean.getMarked() + counterWmActivityId);
									}else{
										forecastSchedualBean.setMarked(forecastSchedualBean.getMarked()+1);
									}	
									markedDetails.add(day);
//									System.out.println("no exceptions");
								}
								
							}
				
					} 
				}
				forecastSchedualBean.setMissingDetails(missingDetails);
				forecastSchedualBean.setLateDetails(lateDetails);
				forecastSchedualBean.setMarkedDetails(markedDetails);
				forecastSchedualBean.setShiftingDetails(shiftingDetails);
				forecastSchedualBean.setShorteningDetails(shorteningDetails);
				forecastSchedualBean.setExtensionDetails(extensionDetails);
//				forecastSchedualBean.setCancelDetails(cancelDetails);
			}else {
//			System.out.println("shifts NULL");
			}
		}
	}
//	private void setArrivalsData(ForecastSchedualBean forecastSchedualBean){
//		System.out.println("in setArrivalsData");
//		Vector shifts=getShiftsData(forecastSchedualBean);
//		if(shifts!=null){
//			// Svetlana
//			//forecastSchedualBean.setArrivals(shifts.size());
//			double arrivals = 0;
//			double missing=0,marked=0,late=0;
//			for(int i=0;i<shifts.size();i++){
//				AgentDayBean day=(AgentDayBean)shifts.get(i);
//				// Svetlana
//				//if(day.getMissingReasonId()>0) missing++;
//				//if(day.getStageLateMinutes()>0) late++;
//				//if(day.getStageArrivalTime()!=null) marked++;
//				double counterWmActivityId = 0;
//				if( forecastForm.getActivityList()!=null && (!"00".equals(forecastForm.getActivityList()[0]))){
//					counterWmActivityId = counterWmActivityId(day.getWmActivityId(),forecastForm.getActivitiesForSelect());
//				}
//				if (counterWmActivityId > 0){
//					if(day.getMissingReasonId()>0) missing=missing + counterWmActivityId;
//					if(day.getStageLateMinutes()>0) late=late + counterWmActivityId;
//					if(day.getStageArrivalTime()!=null) marked=marked + counterWmActivityId;
//					arrivals = arrivals + counterWmActivityId; 
//				}else{
//					if(day.getMissingReasonId()>0) missing++;
//					if(day.getStageLateMinutes()>0) late++;
//					if(day.getStageArrivalTime()!=null) marked++;
//					arrivals++;
//				}	
//			}
//
//			forecastSchedualBean.setMarked(marked);
//			forecastSchedualBean.setMissing(missing);
//			forecastSchedualBean.setLate(late);
//			forecastSchedualBean.setArrivals(arrivals);
//			forecastSchedualBean.setNotMarked(arrivals-missing-marked);
//			
//		}
//	}

	private Vector getShiftsDataNew(){
		
		Vector vector=null;
		StringBuffer sql=new StringBuffer();
		sql.append("select d.*, ");
		sql.append("c.NEW_ACTIVITY, ");
		sql.append("c.NEW_DAY_END, ");
		sql.append("c.NEW_DAY_START, ");
		sql.append("c.NEW_DAY_TYPE, ");
		sql.append("c.NEW_EMPLOYEE_ID, ");
		sql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sql.append("c.NEW_PAID_MINUTES, ");
		sql.append("c.NEW_SHIFT_END, ");
		sql.append("c.NEW_SHIFT_START, ");
		sql.append("c.NEW_SITE_ID, ");
		sql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sql.append("c.NEW_WORK_MINUTES, ");
		sql.append("c.START_CHANGE_REASON, ");
		sql.append("c.END_CHANGE_REASON, ");
		sql.append("c.SWITCH_DAY_ID, ");
		sql.append("c.MODIFICATION_TIME, ");
		sql.append("c.MODIFICATION_USER, ");
		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sql.append("a.STATION_ARRIVAL_TIME ,  ");
		sql.append("a.STAGE_ARRIVAL_USER , ");
		sql.append("a.STATION_ARRIVAL_USER ,  ");
		sql.append("a.STAGE_LATE_MINUTES , ");
		sql.append("a.LATE_MINUTES , ");
		sql.append("a.LATE_REASON_ID , ");
		sql.append("a.MISS_REASON_ID , ");
		sql.append("a.MISSING_TIME , ");
		sql.append("a.MISSING_REMARK , ");
		sql.append("a.LATE_REMARK , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");

		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.JOB_NAME, ");
		sql.append("e.HOME_PHONE, ");
		sql.append("e.CELLULAR_PHONE, ");
		sql.append("e.ORG_UNIT_ID, ");
		
		sql.append("u.ORG_UNIT_ID, ");
		sql.append("u.ORG_UNIT_NAME, "); 
		sql.append("u.PARENT_UNIT, "); 
		sql.append("u.UNIT_TYPE_ID ");

		sql.append("from SHIFTER.shf_employee_day d ");
		sql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id = c.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID, d.emp_id_number) ");
		//sql.append("left join SHIFTER.shf_employees e_old on substr(e_old.emp_id_number,1,8) = d.emp_id_number ");		
		sql.append("left join SHIFTER.shf_attendance a on nvl(c.shf_employee_day_id, d.shf_employee_day_id) = a.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		sql.append("where e.employee_id is not null AND NVL(c.NEW_DAY_TYPE,d.WM_DAY_TYPE) = ? ");
		sql.append("and nvl(c.NEW_SHIFT_START, d.wm_shift_start_datetime) >= ? ");
		sql.append("and nvl(c.NEW_SHIFT_START, d.wm_shift_start_datetime) < ? + 1/24 ");
		
		if (forecastForm.getRbChoice().equals("moked")) {
			sql.append(" and nvl(c.new_site_id, d.wm_site_id)= ? ");
		}
		if (forecastForm.getRbChoice().equals("team")) {
			sql.append("and e.ORG_UNIT_ID = ? ");
		}
		
		// Svetlana
		if( ((ForecastForm)forecastForm).getInnerJobList()!=null && (!"00".equals(((ForecastForm)forecastForm).getInnerJobList()[0]))){
			sql.append("AND e.INNER_JOB_ID in (");
			String[] array = ((ForecastForm)forecastForm).getInnerJobList();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")");
		}
//		if ( forecastForm.getInnerJobList() != null && ( ! "00".equals(forecastForm.getInnerJobList()[0])) ) {
		// Svetlana SHF_EMPLOYEE_DAY.WM_SCH_ACTIVITY_ID_DATA ( example - 1205;1173;1175;1610;1625;) for 5 times
		//sql.append("and replace(d.wm_sch_activity_id_data,';','') in ( " + forecastForm.getActivitiesForSelect()+ " )  order by e.FIRST_NAME ");
		sql.append("AND ( ");
		sql.append(" ( INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1,1) = 0 AND ( replace(D.WM_SCH_ACTIVITY_ID_DATA,';','') in ( " + forecastForm.getActivitiesForSelect() + " ) ) ) ");
		sql.append(" OR SUBSTR(D.WM_SCH_ACTIVITY_ID_DATA, 1 ,INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1,1)-1) in ( " + forecastForm.getActivitiesForSelect() + " ) "); 
		int j = 2;
		for(int i = 1; i < 5; i++ ){
			sql.append("OR ( INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + j + ") > 0 AND SUBSTR(D.WM_SCH_ACTIVITY_ID_DATA, INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + i + ")+1, INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + j + ") - INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + i + ") - 1) in ( " + forecastForm.getActivitiesForSelect() + " ) ) ");
			j++;
		
		}
		sql.append(" ) ");
//		}
		sql.append("order by e.FIRST_NAME ");

//		sql.append("and replace(d.wm_sch_activity_id_data,';','')=? ");
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(param++,SHFConstants.DAY_TYPE_ACTIVITY);
			db.setTimestamp(param++,dateFromAll);
			db.setTimestamp(param++,dateToAll);

			if (forecastForm.getRbChoice().equals("moked")) {
				db.setString(param++,SHFTableUtils.getSiteCodeOfUnit(forecastForm.getMoked()));
			}
			if (forecastForm.getRbChoice().equals("team")) {
				db.setString(param++, forecastForm.getTeam());
			}
			//db.setString(param++,forecastForm.getActivity());
			db.executeQuery();
			vector=new Vector();
			db.populate("bzq.shf.bean.AgentDayBean", vector);

		}catch (DBQueryNoRowsException e) {

		}catch (DBException e) {
			e.printStackTrace();
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				e.printStackTrace();
			}
		}
		return vector;
	}
	
	
	
//	private Vector getShiftsData(ForecastSchedualBean forecastSchedualBean){
//		Vector vector=null;
//		StringBuffer sql=new StringBuffer();
//		sql.append("select d.*, ");
//		sql.append("c.NEW_ACTIVITY, ");
//		sql.append("c.NEW_DAY_END, ");
//		sql.append("c.NEW_DAY_START, ");
//		sql.append("c.NEW_DAY_TYPE, ");
//		sql.append("c.NEW_EMPLOYEE_ID, ");
//		sql.append("c.NEW_EXCEPTION_TYPE_ID, ");
//		sql.append("c.NEW_PAID_MINUTES, ");
//		sql.append("c.NEW_SHIFT_END, ");
//		sql.append("c.NEW_SHIFT_START, ");
//		sql.append("c.NEW_SITE_ID, ");
//		sql.append("c.NEW_TIMEOFF_TYPE_ID, ");
//		sql.append("c.NEW_WORK_MINUTES, ");
//		sql.append("c.START_CHANGE_REASON, ");
//		sql.append("c.END_CHANGE_REASON, ");
//		sql.append("c.SWITCH_DAY_ID, ");
//		sql.append("c.MODIFICATION_TIME, ");
//		sql.append("c.MODIFICATION_USER, ");
//		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
//		sql.append("a.STATION_ARRIVAL_TIME ,  ");
//		sql.append("a.STAGE_ARRIVAL_USER , ");
//		sql.append("a.STATION_ARRIVAL_USER ,  ");
//		sql.append("a.STAGE_LATE_MINUTES , ");
//		sql.append("a.LATE_MINUTES , ");
//		sql.append("a.LATE_REASON_ID , ");
//		sql.append("a.MISS_REASON_ID , ");
//		sql.append("a.MISSING_TIME , ");
//		sql.append("a.MISSING_REMARK , ");
//		sql.append("a.LATE_REMARK , ");
//		sql.append("a.STATION_EXIT_TIME, ");
//		sql.append("a.STATION_EXIT_USER, ");
//
//		sql.append("e.EMPLOYEE_ID, ");
//		sql.append("e.LAST_NAME, ");
//		sql.append("e.FIRST_NAME, ");
//		sql.append("e.JOB_ID, ");
//		sql.append("e.ORG_UNIT_ID ");
//
//		//sql.append("e_old.EMPLOYEE_ID AS EMPLOYEE_ID_OLD, ");
//		//sql.append("e_old.LAST_NAME AS LAST_NAME_OLD, ");
//		//sql.append("e_old.FIRST_NAME AS FIRST_NAME_OLD ");
//
//		sql.append("from SHIFTER.shf_employee_day d ");
//		sql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
//		sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
//		//sql.append("left join SHIFTER.shf_employees e_old on substr(e_old.emp_id_number,1,8) = d.emp_id_number ");		
//		sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
//		//sql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
//		sql.append("where e.employee_id is not null AND NVL(c.NEW_DAY_TYPE,d.WM_DAY_TYPE) = ? ");
//		sql.append("and nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) >= ? ");
//		sql.append("and nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) < ? + 1/24 ");
//		
//		sql.append("and nvl(c.new_site_id,d.wm_site_id)= ? ");
//		
//		// Svetlana
//		if( ((ForecastForm)forecastForm).getInnerJobList()!=null && (!"00".equals(((ForecastForm)forecastForm).getInnerJobList()[0]))){
//			sql.append("AND e.INNER_JOB_ID in (");
//			String[] array = ((ForecastForm)forecastForm).getInnerJobList();
//			for(int i=0;i<array.length;i++){
//				sql.append(array[i]);
//				if(i<array.length-1) sql.append(",");
//			}
//			sql.append(")");
//		}
//		
//		// Svetlana SHF_EMPLOYEE_DAY.WM_SCH_ACTIVITY_ID_DATA ( example - 1205;1173;1175;1610;1625;) for 5 times
//		//sql.append("and replace(d.wm_sch_activity_id_data,';','')=? order by e.FIRST_NAME  ");
//		sql.append("AND ( ");
//		sql.append(" ( INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1,1) = 0 AND ( replace(D.WM_SCH_ACTIVITY_ID_DATA,';','') = ? ) ) ");
//		sql.append(" OR SUBSTR(D.WM_SCH_ACTIVITY_ID_DATA, 1 ,INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1,1)-1) = ? "); 
//		int j = 2;
//		for(int i = 1; i < 5; i++ ){
//			sql.append("OR ( INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + j + ") > 0 AND SUBSTR(D.WM_SCH_ACTIVITY_ID_DATA, INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + i + ")+1, INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + j + ") - INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + i + ") - 1) = ? ) ");
//			j++;
//		}
//		sql.append("    ) order by e.FIRST_NAME ");
//		
//		int param=1;
//		DBAccess db=null;
//		try{
//			db=new DBAccess();
//			db.prepareStatement(sql.toString());
//			db.setInt(param++,SHFConstants.DAY_TYPE_ACTIVITY);
//			db.setTimestamp(param++,forecastSchedualBean.getTime());
//			db.setTimestamp(param++,forecastSchedualBean.getTime());
//			db.setString(param++,SHFTableUtils.getSiteCodeOfUnit(forecastForm.getMoked()));
//			db.setString(param++,forecastForm.getActivity());
//			db.setString(param++,forecastForm.getActivity());
//			db.setString(param++,forecastForm.getActivity());
//			db.setString(param++,forecastForm.getActivity());
//			db.setString(param++,forecastForm.getActivity());
//			db.setString(param++,forecastForm.getActivity());
//			db.executeQuery();
//			vector=new Vector();
//			db.populate("bzq.shf.bean.AgentDayBean", vector);
//			//AgentDayBean day=null;
//			//while(db.next()){
//				//day=new AgentDayBean(); 
//				//db.populate(day);
//				//if(SHFTableUtils.getActivityCodeWithoutColon(day.getActivity()).equals(forecastForm.getActivity())){
//				//	vector.add(day);
//				//}
//			//}
//			
//			
//		}catch (DBQueryNoRowsException e) {
//			
//		}catch (DBException e) {
//			e.printStackTrace();
//		}finally{
//			try {
//				db.close();
//			} catch (DBException e) {
//				e.printStackTrace();
//			}
//		}
//		return vector;
//	}
	private Vector<AgentDayBean> getShiftsSumDataSHF() {
//		System.out.println("in getShiftsSumDataSHF");
		//Yuval Ovadia
		Vector<AgentDayBean> vector = null;
		StringBuffer sql = new StringBuffer();
		sql.append("select d.*, ");
		sql.append("c.NEW_ACTIVITY, ");
		sql.append("c.NEW_DAY_END, ");
		sql.append("c.NEW_DAY_START, ");
		sql.append("c.NEW_DAY_TYPE, ");
		sql.append("c.NEW_EMPLOYEE_ID, ");
		sql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sql.append("c.NEW_PAID_MINUTES, ");
		sql.append("c.NEW_SHIFT_END, ");
		sql.append("c.NEW_SHIFT_START, ");
		sql.append("c.NEW_SITE_ID, ");
		sql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sql.append("c.NEW_WORK_MINUTES, ");
		sql.append("c.START_CHANGE_REASON, ");
		sql.append("c.END_CHANGE_REASON, ");
		sql.append("c.SWITCH_DAY_ID, ");
		sql.append("c.cancel_reason_code, ");
		sql.append("c.MODIFICATION_TIME, ");
		sql.append("c.MODIFICATION_USER, ");
		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sql.append("a.STATION_ARRIVAL_TIME ,  ");
		sql.append("a.STAGE_ARRIVAL_USER , ");
		sql.append("a.STATION_ARRIVAL_USER ,  ");
		sql.append("a.STAGE_LATE_MINUTES , ");
		sql.append("a.LATE_MINUTES , ");
		sql.append("a.LATE_REASON_ID , ");
		sql.append("a.MISS_REASON_ID , ");
		sql.append("a.MISSING_TIME , ");
		sql.append("a.MISSING_REMARK , ");
		sql.append("a.LATE_REMARK , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");

		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.ORG_UNIT_ID ");
		
		sql.append("from SHIFTER.shf_employee_day d ");
		sql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id = c.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");		
		sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id = a.shf_employee_day_id ");
		sql.append("where e.employee_id is not null AND NVL(c.NEW_DAY_TYPE,d.WM_DAY_TYPE) = ? "); //1
//		sql.append("and nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) < ?+1/24 ");
//		sql.append("and nvl(c.NEW_SHIFT_END,d.wm_shift_end_datetime) > ? ");
//yuvalov		
		sql.append("and ( ");
		sql.append("	    (nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) between ? and ? ) "); //2+3
		sql.append("	    or "); 
		sql.append("	    (nvl(c.NEW_SHIFT_END,d.wm_shift_end_datetime) between ? and ? ) "); // 4+5
		sql.append("	    or "); 
		sql.append("	    ( nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) >= ? and nvl(c.NEW_SHIFT_END,d.wm_shift_end_datetime) <= ? ) "); //6+7
		sql.append("	    ) ");

		if (forecastForm.getRbChoice().equals("moked")) {
			sql.append("and nvl(c.new_site_id, d.wm_site_id)= ? "); //8
		}	
		if (forecastForm.getRbChoice().equals("team")) {
			sql.append("and e.ORG_UNIT_ID = ? "); //9
		}
		
		// Svetlana
		if( ((ForecastForm)forecastForm).getInnerJobList()!=null && (!"00".equals(((ForecastForm)forecastForm).getInnerJobList()[0]))){
			sql.append("AND e.INNER_JOB_ID in (");
			String[] array = ((ForecastForm)forecastForm).getInnerJobList();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")");
		}
		
		// Svetlana SHF_EMPLOYEE_DAY.WM_SCH_ACTIVITY_ID_DATA ( example - 1205;1173;1175;1610;1625;) for 5 times
		//sql.append("and replace(d.wm_sch_activity_id_data,';','') in ( " + forecastForm.getActivitiesForSelect()+ " ) order by e.FIRST_NAME ");
//		if ( forecastForm.getInnerJobList() != null && ( ! "00".equals(forecastForm.getInnerJobList()[0])) ) { // Since demand to change activity after agents switch shifts from diff sites, the job list will be checked only if NOT all activities selected. Igal 8.2013
			sql.append("AND ( ");
			sql.append(" ( INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1,1) = 0 AND ( replace(D.WM_SCH_ACTIVITY_ID_DATA,';','') in ( " + forecastForm.getActivitiesForSelect() + " ) ) ) ");
			sql.append(" OR SUBSTR(D.WM_SCH_ACTIVITY_ID_DATA, 1 ,INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1,1)-1) in ( " + forecastForm.getActivitiesForSelect() + " ) "); 
			int j = 2;
			for(int i = 1; i < 5; i++ ){
				sql.append("OR ( INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + j + ") > 0 AND SUBSTR(D.WM_SCH_ACTIVITY_ID_DATA, INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + i + ")+1, INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + j + ") - INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + i + ") - 1) in ( " + forecastForm.getActivitiesForSelect() + " ) )");
				j++;
			}
			sql.append(" ) ");
//		}
		sql.append("order by e.FIRST_NAME ");
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(param++,SHFConstants.DAY_TYPE_ACTIVITY); //1
			db.setTimestamp(param++,dateFromAll); //2
			db.setTimestamp(param++,dateToAll); // 3
			db.setTimestamp(param++,dateFromAll); // 4
			db.setTimestamp(param++,dateToAll); //5
			db.setTimestamp(param++,dateFromAll); //6
			db.setTimestamp(param++,dateToAll); //7
			if (forecastForm.getRbChoice().equals("moked")) {
				db.setString(param++,SHFTableUtils.getSiteCodeOfUnit(forecastForm.getMoked())); //8
			}
			if (forecastForm.getRbChoice().equals("team")) {
				db.setString(param++, forecastForm.getTeam()); //9
			}
			//db.setString(param++,forecastForm.getActivity());
//			System.out.println("executeQuery()");
			db.executeQuery();
//			System.out.println(sql.toString());
//			System.out.println("type: "+SHFConstants.DAY_TYPE_ACTIVITY+" date from: "+SHFUtils.formatDateToString(dateFromAll, "dd/MM/yyyy HH:mm") +" date to: "+SHFUtils.formatDateToString(dateToAll, "dd/MM/yyyy HH:mm")+" site: "+SHFTableUtils.getSiteCodeOfUnit(forecastForm.getMoked()));
			vector=new Vector<AgentDayBean>();
			db.populate("bzq.shf.bean.AgentDayBean", vector);
//			for (AgentDayBean day : vector){
//				System.out.println("DB day id: "+day.getAgentDayId()+", agent id num: "+day.getEmpIdNumber());
//			}
			
			/*AgentDayBean day=null;
			while(db.next()){
				day=new AgentDayBean(); 
				db.populate(day);
				if(SHFTableUtils.getActivityCodeWithoutColon(day.getActivity()).equals(forecastForm.getActivity())){
					vector.add(day);
				}
			}*/
			
			
		}catch (DBQueryNoRowsException e) {
//			System.out.println("DB No rows excep");
		}catch (DBException e) {
			e.printStackTrace();
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				e.printStackTrace();
			}
		}
		
		return vector;
	}	
	
	private Vector getShiftsCalncelledSHF() {
		//Yuval Ovadia
		Vector<AgentDayBean> vector=null;
		StringBuffer sql=new StringBuffer();
		sql.append("select d.*, ");
		sql.append("c.NEW_ACTIVITY, ");
		sql.append("c.NEW_DAY_END, ");
		sql.append("c.NEW_DAY_START, ");
		sql.append("c.NEW_DAY_TYPE, ");
		sql.append("c.NEW_EMPLOYEE_ID, ");
		sql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sql.append("c.NEW_PAID_MINUTES, ");
		sql.append("c.NEW_SHIFT_END, ");
		sql.append("c.NEW_SHIFT_START, ");
		sql.append("c.NEW_SITE_ID, ");
		sql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sql.append("c.NEW_WORK_MINUTES, ");
		sql.append("c.START_CHANGE_REASON, ");
		sql.append("c.END_CHANGE_REASON, ");
		sql.append("c.SWITCH_DAY_ID, ");
		sql.append("c.MODIFICATION_TIME, ");
		sql.append("c.MODIFICATION_USER, ");
		sql.append("C.CANCEL_REASON_CODE, ");
		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sql.append("a.STATION_ARRIVAL_TIME ,  ");
		sql.append("a.STAGE_ARRIVAL_USER , ");
		sql.append("a.STATION_ARRIVAL_USER ,  ");
		sql.append("a.STAGE_LATE_MINUTES , ");
		sql.append("a.LATE_MINUTES , ");
		sql.append("a.LATE_REASON_ID , ");
		sql.append("a.MISS_REASON_ID , ");
		sql.append("a.MISSING_TIME , ");
		sql.append("a.MISSING_REMARK , ");
		sql.append("a.LATE_REMARK , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");

		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.ORG_UNIT_ID ");
		
		sql.append("from SHIFTER.shf_employee_day d ");
		sql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id = c.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = d.emp_id_number ");		
		sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
		sql.append("where e.employee_id is not null ");
//		sql.append("AND NVL(c.NEW_DAY_TYPE,d.WM_DAY_TYPE) = ? ");
		sql.append("and ( (c.NEW_EMPLOYEE_ID = 99999999) or (a.miss_reason_id = ?) ) "); //1
//		sql.append("and nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) < ?+1/24 ");
//		sql.append("and nvl(c.NEW_SHIFT_END,d.wm_shift_end_datetime) > ? ");
		
		sql.append("and ( ");
		sql.append("	    (nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) between ? and ? ) "); //2+3
		sql.append("	    or "); 
		sql.append("	    (nvl(c.NEW_SHIFT_END,d.wm_shift_end_datetime) between ? and ? ) "); //4+5
		sql.append("	    or "); 
		sql.append("	    ( nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) >= ? and nvl(c.NEW_SHIFT_END,d.wm_shift_end_datetime) <= ? ) "); //6+7
		sql.append("	    ) ");

		if (forecastForm.getRbChoice().equals("moked")) {
			sql.append("and nvl(c.new_site_id, d.wm_site_id)= ? "); //8
		}
		if (forecastForm.getRbChoice().equals("team")) {
			sql.append("and e.ORG_UNIT_ID = ? "); //9
		}
		
		// Svetlana
		if( ((ForecastForm)forecastForm).getInnerJobList()!=null && (!"00".equals(((ForecastForm)forecastForm).getInnerJobList()[0]))){
			sql.append("AND e.INNER_JOB_ID in (");
			String[] array = ((ForecastForm)forecastForm).getInnerJobList();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")");
		}
		if ( forecastForm.getInnerJobList() != null && ( ! "00".equals(forecastForm.getInnerJobList()[0])) ) {
    	// Svetlana SHF_EMPLOYEE_DAY.WM_SCH_ACTIVITY_ID_DATA ( example - 1205;1173;1175;1610;1625;) for 5 times
		//sql.append("and replace(d.wm_sch_activity_id_data,';','') in ( " + forecastForm.getActivitiesForSelect()+ " ) order by e.FIRST_NAME  ");
		sql.append("AND ( ");
		sql.append(" ( INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1,1) = 0 AND ( replace(D.WM_SCH_ACTIVITY_ID_DATA,';','') in ( " + forecastForm.getActivitiesForSelect() + " ) ) ) ");
		sql.append(" OR SUBSTR(D.WM_SCH_ACTIVITY_ID_DATA, 1 ,INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1,1)-1) in ( " + forecastForm.getActivitiesForSelect() + " ) "); 
		int j = 2;
		for(int i = 1; i < 5; i++ ){
			sql.append("OR ( INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + j + ") > 0 AND SUBSTR(D.WM_SCH_ACTIVITY_ID_DATA, INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + i + ")+1, INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + j + ") - INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + i + ") - 1) in ( " + forecastForm.getActivitiesForSelect() + " ) ) ");
			j++;
		}
		sql.append(" ) ");
		}
		sql.append("order by e.FIRST_NAME ");
		
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt	   (param++,SHFConstants.SHIFT_REDUCE_BY_STAGE); //1
//			db.setInt	   (param++,SHFConstants.DAY_TYPE_DAYOFF); 
			db.setTimestamp(param++,dateFromAll); //2
			db.setTimestamp(param++,dateToAll); //3
			db.setTimestamp(param++,dateFromAll); //4
			db.setTimestamp(param++,dateToAll); //5
			db.setTimestamp(param++,dateFromAll); //6
			db.setTimestamp(param++,dateToAll); //7
			if (forecastForm.getRbChoice().equals("moked")) {
				db.setString(param++,SHFTableUtils.getSiteCodeOfUnit(forecastForm.getMoked())); //8
			}
			if (forecastForm.getRbChoice().equals("team")) {
				db.setString(param++, forecastForm.getTeam()); //9
			}
			//db.setString(param++,forecastForm.getActivity());
			db.executeQuery();
			vector=new Vector<AgentDayBean>();
			db.populate("bzq.shf.bean.AgentDayBean", vector);
			if (vector != null){
				for(AgentDayBean day : vector){
//					System.out.println("db cancel id: "+day.getAgentDayId());
				}
			}
			/*AgentDayBean day=null;
			while(db.next()){
				day=new AgentDayBean(); 
				db.populate(day);
				if(SHFTableUtils.getActivityCodeWithoutColon(day.getActivity()).equals(forecastForm.getActivity())){
					vector.add(day);
				}
			}*/
			
			
		}catch (DBQueryNoRowsException e) {
//			System.out.println("cancelData DB sql null");
		}catch (DBException e) {
			e.printStackTrace();
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				e.printStackTrace();
			}
		}
		return vector;
	}	
	
	private Vector getShiftsSumDataAfterChange(ForecastSchedualBean forecastSchedualBean) {
		Vector vector=null;
		StringBuffer sql=new StringBuffer();
		
		
	/*
		
		sql.append("select d.*, ");
		sql.append("c.NEW_ACTIVITY, ");
		sql.append("c.NEW_DAY_END, ");
		sql.append("c.NEW_DAY_START, ");
		sql.append("c.NEW_DAY_TYPE, ");
		sql.append("c.NEW_EMPLOYEE_ID, ");
		sql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sql.append("c.NEW_PAID_MINUTES, ");
		sql.append("c.NEW_SHIFT_END, ");
		sql.append("c.NEW_SHIFT_START, ");
		sql.append("c.NEW_SITE_ID, ");
		sql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sql.append("c.NEW_WORK_MINUTES, ");
		sql.append("c.START_CHANGE_REASON, ");
		sql.append("c.END_CHANGE_REASON, ");
		sql.append("c.SWITCH_DAY_ID, ");
		sql.append("c.MODIFICATION_TIME, ");
		sql.append("c.MODIFICATION_USER, ");
		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sql.append("a.STATION_ARRIVAL_TIME ,  ");
		sql.append("a.STAGE_ARRIVAL_USER , ");
		sql.append("a.STATION_ARRIVAL_USER ,  ");
		sql.append("a.STAGE_LATE_MINUTES , ");
		sql.append("a.LATE_MINUTES , ");
		sql.append("a.LATE_REASON_ID , ");
		sql.append("a.MISS_REASON_ID , ");
		sql.append("a.MISSING_TIME , ");
		sql.append("a.MISSING_REMARK , ");
		sql.append("a.LATE_REMARK , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");

		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.ORG_UNIT_ID ");

		//sql.append("e_old.EMPLOYEE_ID AS EMPLOYEE_ID_OLD, ");
		//sql.append("e_old.LAST_NAME AS LAST_NAME_OLD, ");
		//sql.append("e_old.FIRST_NAME AS FIRST_NAME_OLD ");

		sql.append("from SHIFTER.shf_employee_day d ");
		sql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
		//sql.append("left join SHIFTER.shf_employees e_old on substr(e_old.emp_id_number,1,8) = d.emp_id_number ");		
		sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
		//sql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		sql.append("where e.employee_id is not null AND NVL(c.NEW_DAY_TYPE,d.WM_DAY_TYPE) = ? ");
		sql.append("and nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) < ?+1/24 ");
		sql.append("and nvl(c.NEW_SHIFT_END,d.wm_shift_end_datetime) > ? ");
		sql.append("and nvl(c.new_site_id,d.wm_site_id)= ? ");
		sql.append("and replace(d.wm_sch_activity_id_data,';','')=? ");
		
		
	*/
	
	//   tamar
	
		sql.append(" select c.NEW_ACTIVITY, ");
		sql.append("c.NEW_DAY_END, ");
		sql.append("c.NEW_DAY_START, ");
		sql.append("c.NEW_DAY_TYPE, ");
		sql.append("c.NEW_EMPLOYEE_ID, ");
		sql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sql.append("c.NEW_PAID_MINUTES, ");
		sql.append("c.NEW_SHIFT_END, ");
		sql.append("c.NEW_SHIFT_START, ");
		sql.append("c.NEW_SITE_ID, ");
		sql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sql.append("c.NEW_WORK_MINUTES, ");
		sql.append("c.START_CHANGE_REASON, ");
		sql.append("c.END_CHANGE_REASON, ");
		sql.append("c.SWITCH_DAY_ID, ");
		sql.append("c.MODIFICATION_TIME, ");
		sql.append("c.MODIFICATION_USER, ");
		
		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sql.append("a.STATION_ARRIVAL_TIME ,  ");
		sql.append("a.STAGE_ARRIVAL_USER , ");
		sql.append("a.STATION_ARRIVAL_USER ,  ");
		sql.append("a.STAGE_LATE_MINUTES , ");
		sql.append("a.LATE_MINUTES , ");
		sql.append("a.LATE_REASON_ID , ");
		sql.append("a.MISS_REASON_ID , ");
		sql.append("a.MISSING_TIME , ");
		sql.append("a.MISSING_REMARK , ");
		sql.append("a.LATE_REMARK , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");

		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.ORG_UNIT_ID ");

		sql.append("from SHIFTER.shf_employees e ,shifter.shf_day_changes c ");
		sql.append("left join SHIFTER.shf_attendance a on c.new_employee_id=a.shf_employee_day_id  ");
		sql.append("WHERE e.employee_id is not null "); 
		sql.append("and e.employee_id is not null and	 substr(e.emp_id_number,1,8) = c.NEW_EMPLOYEE_ID ");
		sql.append("AND c.NEW_DAY_TYPE = ? "); 
		sql.append("and c.NEW_SHIFT_START < ?+1/24 ");
		
		sql.append("and c.NEW_SHIFT_END > ? ");
		
		
		
		sql.append("and c.new_site_id= ?  order by e.FIRST_NAME ");
		
		sql.append("union all ");
		
		sql.append("(select d.wm_sch_activity_id_data, ");
		sql.append("d.WM_END_DATETIME, ");
		sql.append("d.WM_START_DATETIME, ");
		sql.append("d.wm_day_type, ");
		sql.append("d.emp_id_number, ");
		sql.append("d.wm_exception_type_id, ");
		sql.append("d.wm_work_minutes, ");
		sql.append("d.wm_shift_end_datetime, ");
		sql.append("d.wm_shift_start_datetime, ");
		sql.append("d.wm_site_id, ");
		sql.append("d.wm_timeoff_type_id, ");
		sql.append("d.wm_work_minutes, ");
		sql.append("null, ");
		sql.append("null, ");
		sql.append("null, ");
		sql.append("null, ");
		sql.append("null, ");
		
		
		
		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sql.append("a.STATION_ARRIVAL_TIME ,  ");
		sql.append("a.STAGE_ARRIVAL_USER , ");
		sql.append("a.STATION_ARRIVAL_USER ,  ");
		sql.append("a.STAGE_LATE_MINUTES , ");
		sql.append("a.LATE_MINUTES , ");
		sql.append("a.LATE_REASON_ID , ");
		sql.append("a.MISS_REASON_ID , ");
		sql.append("a.MISSING_TIME , ");
		sql.append("a.MISSING_REMARK , ");
		sql.append("a.LATE_REMARK , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");

		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.ORG_UNIT_ID ");

		sql.append("from SHIFTER.shf_employees e ,SHIFTER.shf_employee_day d "); 
		sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id "); 
		sql.append("WHERE e.employee_id is not null ");
		sql.append("and	 substr(e.emp_id_number,1,8) = d.emp_id_number ");
		sql.append("AND d.WM_DAY_TYPE= ? ");
		sql.append("and d.wm_shift_start_datetime < ?+1/24 ");
		sql.append("and d.wm_shift_end_datetime > ? ");
		
		sql.append("and d.wm_site_id= ? ");
	
		// Svetlana
		if( ((ForecastForm)forecastForm).getInnerJobList()!=null && (!"00".equals(((ForecastForm)forecastForm).getInnerJobList()[0]))){
			sql.append("AND e.INNER_JOB_ID in (");
			String[] array = ((ForecastForm)forecastForm).getInnerJobList();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")");
		}
		if ( forecastForm.getInnerJobList() != null && ( ! "00".equals(forecastForm.getInnerJobList()[0])) ) {
		// Svetlana SHF_EMPLOYEE_DAY.WM_SCH_ACTIVITY_ID_DATA ( example - 1205;1173;1175;1610;1625;) for 5 times
		//sql.append("and replace(d.wm_sch_activity_id_data,';','')=? ");
		sql.append("AND ( ");
		sql.append(" ( INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1,1) = 0 AND ( replace(D.WM_SCH_ACTIVITY_ID_DATA,';','') = ? ) ) ");
		sql.append(" OR SUBSTR(D.WM_SCH_ACTIVITY_ID_DATA, 1 ,INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1,1)-1) = ? "); 
		int j = 2;
		for(int i = 1; i < 5; i++ ){
			sql.append("OR ( INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + j + ") > 0 AND SUBSTR(D.WM_SCH_ACTIVITY_ID_DATA, INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + i + ")+1, INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + j + ") - INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + i + ") - 1) = ? ) ");
			j++;
		}
		sql.append(" ) ");
		}
		sql.append("order by e.FIRST_NAME ");
		
		sql.append("and d.shf_employee_day_id in  ");
		sql.append("(select d.shf_employee_day_id from SHIFTER.shf_employee_day d  minus select c.shf_employee_day_id " );
		sql.append("from shifter.shf_day_changes c) ) order by e.FIRST_NAME ");
		
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			
			db.prepareStatement(sql.toString());
			db.setInt(param++,SHFConstants.DAY_TYPE_ACTIVITY);
			db.setTimestamp(param++,forecastSchedualBean.getTime());
			db.setTimestamp(param++,forecastSchedualBean.getTime());
			db.setString(param++,SHFTableUtils.getSiteCodeOfUnit(forecastForm.getMoked()));
			//db.setString(param++,forecastForm.getActivity());
	
			db.setInt(param++,SHFConstants.DAY_TYPE_ACTIVITY);
			db.setTimestamp(param++,forecastSchedualBean.getTime());
			db.setTimestamp(param++,forecastSchedualBean.getTime());
			db.setString(param++,SHFTableUtils.getSiteCodeOfUnit(forecastForm.getMoked()));
			db.setString(param++,forecastForm.getActivity());
			db.setString(param++,forecastForm.getActivity());
			db.setString(param++,forecastForm.getActivity());
			db.setString(param++,forecastForm.getActivity());
			db.setString(param++,forecastForm.getActivity());
			db.setString(param++,forecastForm.getActivity());
			
			db.executeQuery();
			vector=new Vector();
			db.populate("bzq.shf.bean.AgentDayBean", vector);
			/*AgentDayBean day=null;
			while(db.next()){
				day=new AgentDayBean(); 
				db.populate(day);
				if(SHFTableUtils.getActivityCodeWithoutColon(day.getActivity()).equals(forecastForm.getActivity())){
					vector.add(day);
				}
			}*/
			
			
		}catch (DBQueryNoRowsException e) {
			
		}catch (DBException e) {
			e.printStackTrace();
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				e.printStackTrace();
			}
		}
		return vector;
	}

	
	private Vector getShiftsSumDataWFM(){
		//get all the shifts as they come from WFM
		Vector vector=null;
		StringBuffer sql=new StringBuffer();
		sql.append("select d.*, ");
		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sql.append("a.STATION_ARRIVAL_TIME ,  ");
		sql.append("a.STAGE_ARRIVAL_USER , ");
		sql.append("a.STATION_ARRIVAL_USER ,  ");
		sql.append("a.STAGE_LATE_MINUTES , ");
		sql.append("a.LATE_MINUTES , ");
		sql.append("a.LATE_REASON_ID , ");
		sql.append("a.MISS_REASON_ID , ");
		sql.append("a.MISSING_TIME , ");
		sql.append("a.MISSING_REMARK , ");
		sql.append("a.LATE_REMARK , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");

		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.ORG_UNIT_ID ");

		sql.append("from SHIFTER.shf_employee_day d ");
		sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = d.emp_id_number ");
		sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		sql.append("where e.employee_id is not null AND d.WM_DAY_TYPE = ? ");
		sql.append("and ( ");
		sql.append("	    (d.wm_shift_start_datetime between ? and ? ) ");
		sql.append("	    or "); 
		sql.append("	    (d.wm_shift_end_datetime between ? 	and ? ) ");
		sql.append("	    or "); 
		sql.append("	    ( d.wm_shift_start_datetime >= ? and d.wm_shift_end_datetime <= ? ) ");
		sql.append("	    ) ");
		if (forecastForm.getRbChoice().equals("moked")) {
			sql.append("and d.wm_site_id = ? ");
		}
		if (forecastForm.getRbChoice().equals("team")) {
			sql.append("and e.ORG_UNIT_ID = ? ");
		}
		
		// Svetlana
		if( ((ForecastForm)forecastForm).getInnerJobList()!=null && (!"00".equals(((ForecastForm)forecastForm).getInnerJobList()[0]))){
			sql.append("AND e.INNER_JOB_ID in (");
			String[] array = ((ForecastForm)forecastForm).getInnerJobList();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")");
		}
		
		//yuval
		sql.append("and d.WM_SCHEDULE_DAY_ID is not null ");
		if ( forecastForm.getInnerJobList() != null && ( ! "00".equals(forecastForm.getInnerJobList()[0])) ) {
		// Svetlana SHF_EMPLOYEE_DAY.WM_SCH_ACTIVITY_ID_DATA ( example - 1205;1173;1175;1610;1625;) for 5 times
		//sql.append("and replace(d.wm_sch_activity_id_data,';','') in ("+forecastForm.getActivitiesForSelect()+") order by e.FIRST_NAME ");
		sql.append("AND ( ");
		sql.append(" ( INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1,1) = 0 AND ( replace(D.WM_SCH_ACTIVITY_ID_DATA,';','') in ( " + forecastForm.getActivitiesForSelect() + " ) ) ) ");
		sql.append(" OR SUBSTR(D.WM_SCH_ACTIVITY_ID_DATA, 1 ,INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1,1)-1) in ( " + forecastForm.getActivitiesForSelect() + " ) "); 
		int j = 2;
		for(int i = 1; i < 5; i++ ){
			sql.append("OR ( INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + j + ") > 0 AND SUBSTR(D.WM_SCH_ACTIVITY_ID_DATA, INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + i + ")+1, INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + j + ") - INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + i + ") - 1) in ( " + forecastForm.getActivitiesForSelect() + " ) ) ");
			j++;
		}
		sql.append(" ) ");
		}
		sql.append("order by e.FIRST_NAME ");
		
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(param++,SHFConstants.DAY_TYPE_ACTIVITY);
			db.setTimestamp(param++,dateFromAll);
			db.setTimestamp(param++,dateToAll);
			db.setTimestamp(param++,dateFromAll);
			db.setTimestamp(param++,dateToAll);
			db.setTimestamp(param++,dateFromAll);
			db.setTimestamp(param++,dateToAll);
			if (forecastForm.getRbChoice().equals("moked")) {
				db.setString(param++,SHFTableUtils.getSiteCodeOfUnit(forecastForm.getMoked()));
			}
			if (forecastForm.getRbChoice().equals("team")) {
				db.setString(param++, forecastForm.getTeam());
			}
			db.executeQuery();
			vector=new Vector();
			db.populate("bzq.shf.bean.AgentDayBean", vector);			
		}catch (DBQueryNoRowsException e) {
			
		}catch (DBException e) {
			e.printStackTrace();
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				e.printStackTrace();
			}
		}
		return vector;
	}
		
	
	
	private Vector getShiftsSumDataBeforeChange(ForecastSchedualBean forecastSchedualBean){
		Vector vector=null;
		StringBuffer sql=new StringBuffer();
		sql.append("select d.*, ");
		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sql.append("a.STATION_ARRIVAL_TIME ,  ");
		sql.append("a.STAGE_ARRIVAL_USER , ");
		sql.append("a.STATION_ARRIVAL_USER ,  ");
		sql.append("a.STAGE_LATE_MINUTES , ");
		sql.append("a.LATE_MINUTES , ");
		sql.append("a.LATE_REASON_ID , ");
		sql.append("a.MISS_REASON_ID , ");
		sql.append("a.MISSING_TIME , ");
		sql.append("a.MISSING_REMARK , ");
		sql.append("a.LATE_REMARK , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");

		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.ORG_UNIT_ID ");

		sql.append("from SHIFTER.shf_employee_day d ");
		sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = d.emp_id_number ");
		sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		sql.append("where e.employee_id is not null AND d.WM_DAY_TYPE = ? ");
		sql.append("and d.wm_shift_start_datetime < ? + 1/24	 ");
		sql.append("and d.wm_shift_end_datetime > ? ");
		sql.append("and d.wm_site_id = ? ");
		sql.append("and d.WM_SCHEDULE_DAY_ID is not null ");
		
		// Svetlana
		if( ((ForecastForm)forecastForm).getInnerJobList()!=null && (!"00".equals(((ForecastForm)forecastForm).getInnerJobList()[0]))){
			sql.append("AND e.INNER_JOB_ID in (");
			String[] array = ((ForecastForm)forecastForm).getInnerJobList();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")");
		}
		if ( forecastForm.getInnerJobList() != null && ( ! "00".equals(forecastForm.getInnerJobList()[0])) ) {
		// Svetlana SHF_EMPLOYEE_DAY.WM_SCH_ACTIVITY_ID_DATA ( example - 1205;1173;1175;1610;1625;) for 5 times
		//sql.append("and replace(d.wm_sch_activity_id_data,';','')=? order by e.FIRST_NAME ");
		sql.append("AND ( ");
		sql.append(" ( INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1,1) = 0 AND ( replace(D.WM_SCH_ACTIVITY_ID_DATA,';','') = ? ) ) ");
		sql.append(" OR SUBSTR(D.WM_SCH_ACTIVITY_ID_DATA, 1 ,INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1,1)-1) = ? "); 
		int j = 2;
		for(int i = 1; i < 5; i++ ){
			sql.append("OR ( INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + j + ") > 0 AND SUBSTR(D.WM_SCH_ACTIVITY_ID_DATA, INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + i + ")+1, INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + j + ") - INSTR(D.WM_SCH_ACTIVITY_ID_DATA,';',1," + i + ") - 1) = ? ) ");
			j++;
		}
		sql.append(" ) ");
		}
		sql.append("order by e.FIRST_NAME ");
		
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(param++,SHFConstants.DAY_TYPE_ACTIVITY);
			db.setTimestamp(param++,forecastSchedualBean.getTime());
			db.setTimestamp(param++,forecastSchedualBean.getTime());
			db.setString(param++,SHFTableUtils.getSiteCodeOfUnit(forecastForm.getMoked()));
			db.setString(param++,forecastForm.getActivity());
			db.setString(param++,forecastForm.getActivity());
			db.setString(param++,forecastForm.getActivity());
			db.setString(param++,forecastForm.getActivity());
			db.setString(param++,forecastForm.getActivity());
			db.setString(param++,forecastForm.getActivity());
			
			db.executeQuery();
			vector=new Vector();
			db.populate("bzq.shf.bean.AgentDayBean", vector);
			/*AgentDayBean day=null;
			while(db.next()){
				day=new AgentDayBean(); 
				db.populate(day);
				if(SHFTableUtils.getActivityCodeWithoutColon(day.getActivity()).equals(forecastForm.getActivity())){
					vector.add(day);
				}
			}*/
			
			
		}catch (DBQueryNoRowsException e) {
			
		}catch (DBException e) {
			e.printStackTrace();
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				e.printStackTrace();
			}
		}
		return vector;
	}
	
	private Vector parseSchInfo(Vector forecastDataVec){
		//Yuval Ovadia
		//get vector of all the time range as they come from WFM  
		//with calculated_staffing & required_staffing Data
		Vector vec=null;
		Vector reqVec=null;
		Vector calckVec=null;
		StringTokenizer stAll=null;
		Date time=null;
		ForecastDataBean forecastDataBean = null;
		
		if(forecastDataVec!=null){
		
			reqVec = new Vector();
			calckVec = new Vector();
			for (int i=0; i<forecastDataVec.size(); i++) {
//				forecastDataBean = new ForecastDataBean(); // Igal 5.2013
				forecastDataBean = (ForecastDataBean)forecastDataVec.get(i);
				
				if(forecastDataBean.getCalculatedStaffing()!=null){
					//get calculated_staffing
					stAll=new StringTokenizer(forecastDataBean.getCalculatedStaffing(),";");
					try{	
						int j=0;
						while(stAll.hasMoreTokens()){
							String schNum=stAll.nextToken();
							if(!"*".equals(schNum)){
								if (i==0) {
									//for first time
									calckVec.add((int)BaseConvert.stringToFloat(schNum).floatValue());
								} else {
									
									calckVec.set(j, (Integer)calckVec.get(j) +  (int)BaseConvert.stringToFloat(schNum).floatValue());
//									try{
//										System.out.println("calckVec at "+j+" : "+calckVec.get(j));
//									}catch(Exception e){
//										System.out.println("calckVec(j) size null");
//									}
								}
							}
							else{
								if (i==0) {
									//for first time
									calckVec.add(0);
								}
							}
							j++;
						} //end while
					}catch(ConvertException e){
						//System.out.println(e.getMessage());
					}
				}else{
					//System.out.println("forecastDataBean.getCalculatedStaffing() is null");
				}
				if(forecastDataBean.getRequiredStaffing()!=null){
					//get required_staffing
					stAll=new StringTokenizer(forecastDataBean.getRequiredStaffing(),";");
					try{	
						int j=0;
						while(stAll.hasMoreTokens()){
							String schNum=stAll.nextToken();
							if(!"*".equals(schNum)){
								if (i==0) {
									reqVec.add((int)BaseConvert.stringToFloat(schNum).floatValue());
								} else {
									
									reqVec.set(j, (Integer)reqVec.get(j) +  (int)BaseConvert.stringToFloat(schNum).floatValue());
								}
							}
							else{
								if (i==0) {
									reqVec.add(0);
								}
							}
							j++;
						} //end while
					}catch(ConvertException e){
						//System.out.println(e.getMessage());
					}
				}	
			} //end for
		}
		//get the calulated data into bean to work with
		
		if(forecastDataBean!=null){ // last bean in forecastDataVec (after  "for" loop ends, "forecastDataBean" has the last value from "forecastDataVec")
			
			
			vec=new Vector();
			time=new Date(forecastDataBean.getDate().getTime());
			for (int i=0; i < calckVec.size(); i++) {
				if ((time.after(dateFrom) || time.equals(dateFrom) ) && (time.before(dateTo) || time.equals(dateTo) )) { //if time between
																														//"from" and "to"
																														// from the user
				//if ((int)(Integer)calckVec.get(i) > 0) {
					//get in to the vector only the time with the data in the calculated staff
					ForecastSchedualBean forecastSchedualBean =new ForecastSchedualBean();
					forecastSchedualBean.setTime(new Date(time.getTime()));
					forecastSchedualBean.setTekhnonMaty((int)(Integer)calckVec.get(i)); // setCalcStaffing
					
					if (reqVec!=null && reqVec.size() > 0) {
						forecastSchedualBean.setRequiredStaffing((int)(Integer)reqVec.get(i));
					}
					vec.add(forecastSchedualBean);
				//}
				}
				time.setTime(time.getTime()+15*60*1000);
			}
			
		}	
		return vec;
	}
	
	
	private Vector<ForecastDataBean> getSchedualForecast() throws ShfException {
		logger.debug("Starting getSchedualForecast()");
		//Yuval Ovadia
		//get the activities for the select
		int param=1;
		Vector<ForecastDataBean> vec = null;
		
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT d.* FROM SHIFTER.shf_forecast_activities a ");
		sql.append("LEFT join SHIFTER.shf_forecast_data d ON ");
		sql.append("a.wm_forecast_activity_id=d.wm_forecast_activity_id ");
		sql.append("WHERE d.wm_date=? ");
		sql.append("AND a.wm_activity_id in ( "+ forecastForm.getActivitiesForSelect() +" ) and d.WM_CALCULATED_STAFFING is not null");
		
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setTimestamp(param++,forecastForm.getDate());
			//db.setString(param++,forecastForm.getActivitiesForSelect());
			db.executeQuery();
			vec=new Vector();
			db.populate("bzq.shf.bean.ForecastDataBean", vec);
		}catch(DBQueryNoRowsException e){
			
		}catch(DBException e){
			logger.error("error in getCallsForecast() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try{
				db.close();
			}catch (DBException e) {
				logger.error("error in getCallsForecast() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		return vec;
	}

	public void setActivityFromVirtual() throws ShfException {
		String strVirtual = new String();
		String strAct = new String();
		
		if (!forecastForm.getVirtualActivity()[0].equals("00")) {
			
			for (int i=0; i < forecastForm.getVirtualActivity().length-1;i++) {
				strVirtual = strVirtual + forecastForm.getVirtualActivity()[i] + ", ";
			}
			strVirtual = strVirtual + forecastForm.getVirtualActivity()[forecastForm.getVirtualActivity().length-1];
		}
		
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT A.* ");
		sql.append("FROM SHIFTER.SHF_VIRTUAL_ACTIVITIES V, SHIFTER.SHF_ACTIVITY_TYPE A ");
		sql.append("WHERE V.VIRTUAL_ACTIVITY_ID = A.VIRTUAL_ACTIVITY_ID ");
		if (!forecastForm.getVirtualActivity()[0].equals("00")) {
			sql.append("  AND A.VIRTUAL_ACTIVITY_ID IN ( " + strVirtual + " )");
		}

		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.executeQuery();
			Vector vector = new Vector();
			db.populate("bzq.shf.bean.ActivitiesDbBean", vector);
			for (int i=0; i<vector.size()-1; i++ ) {
				strAct = strAct + ((ActivitiesDbBean)vector.get(i)).getActivityCode() + " ,";
			}
			strAct = strAct + ((ActivitiesDbBean)vector.get(vector.size()-1)).getActivityCode();
			
			forecastForm.setActivitiesForSelect(strAct);
			
		}catch(DBQueryNoRowsException e){
			
		}catch(DBException e){
			logger.error("error in setActivityFromVirtual() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try{
				db.close();
			}catch (DBException e) {
				logger.error("error in setActivityFromVirtual() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		
	}

	public void setActivityForSelect() throws ShfException {
		int param=1;
		
		String strSite = SHFTableUtils.getSiteCodeOfUnit(forecastForm.getMoked());
		String strAct = new String();

		if (!forecastForm.getActivityList()[0].equals("00")) {
			//get the selected activities by the user
			int i;
			for (i=0; i < forecastForm.getActivityList().length-1;i++) {
				strAct = strAct + forecastForm.getActivityList()[i] + ", ";
			}
			strAct = strAct + forecastForm.getActivityList()[forecastForm.getActivityList().length-1];
			
		} else {
			//select all activity for site when selected "all activities" by the user
			StringBuffer sql=new StringBuffer();
			sql.append(" SELECT ACTIVITY_TYPE_ID, ACTIVITY_TYPE_NAME, SHORT_NAME, ");
			sql.append(" SITE_ID, VIRTUAL_ACTIVITY_ID ");
			sql.append(" FROM SHIFTER.SHF_ACTIVITY_TYPE ");
			sql.append(" WHERE SITE_ID = ? ");
			if ("frcstCalls".equals(forecastForm.getFrom())){
				sql.append(" AND VIRTUAL_ACTIVITY_ID IS NULL ");
			}
	
			DBAccess db=null;
			try{
				db=new DBAccess();
				db.prepareStatement(sql.toString());
				db.setString(param, strSite);
				db.executeQuery();
				Vector vector = new Vector();
				db.populate("bzq.shf.bean.ActivitiesDbBean", vector);
				
				for (int i=0; i<vector.size()-1; i++ ) {
					strAct = strAct + ((ActivitiesDbBean)vector.get(i)).getActivityCode() + " ,";
				}
				strAct = strAct + ((ActivitiesDbBean)vector.get(vector.size()-1)).getActivityCode();
			}catch(DBQueryNoRowsException e){
				
			}catch(DBException e){
				logger.error("error in setActivityForSelect() : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}finally{
				try{
					db.close();
				}catch (DBException e) {
					logger.error("error in setActivityForSelect() while closing db connection : "+e.getMessage());
					ActionErrors actionErrors = new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
					throw new ShfException(actionErrors);
				}
			} 	
		}// end else
		forecastForm.setActivitiesForSelect(strAct);
	}

	public void setExceptionForSelect() throws ShfException {

		int param=1;
		String strSite = SHFTableUtils.getSiteCodeOfUnit(forecastForm.getMoked());
		String strExcep = new String();

		if (!forecastForm.getExceptionList()[0].equals("00")) {
			//get the selected exception by the user
			int i;
			for (i=0; i < forecastForm.getExceptionList().length-1;i++) {
				strExcep = strExcep + forecastForm.getExceptionList()[i] + ", ";
			}
			strExcep = strExcep + forecastForm.getExceptionList()[forecastForm.getExceptionList().length-1];
			
		} else {
			//select all exeptions for site when selected "all exceptions" by the user
			StringBuffer sql=new StringBuffer();
			sql.append(" SELECT EXCEPTION_TYPE_ID, CONVERTABLE_TO_DAYOFF, EXCEPTION_TYPE_NAME, ");
			sql.append(" FULL_DAY, ONSITE, OPTIONAL1, OPTIONAL2, PAID, SHORT_NAME, ");
			sql.append(" SITE_ID, USED_AS_VACATION, USED_IN_MEETING ");
			sql.append(" FROM SHIFTER.SHF_EXCEPTION_TYPE ");
			sql.append(" WHERE SITE_ID = ? ");
	
			DBAccess db=null;
			try{
				db=new DBAccess();
				db.prepareStatement(sql.toString());
				db.setString(param, strSite);
				db.executeQuery();
				Vector vector = new Vector();
				db.populate("bzq.shf.bean.ExceptionActivityBean", vector);
				
				for (int i=0; i<vector.size()-1; i++ ) {
					strExcep = strExcep + ((ExceptionActivityBean)vector.get(i)).getExceptionCode() + " ,";
				}
				strExcep = strExcep + ((ExceptionActivityBean)vector.get(vector.size()-1)).getExceptionCode();
			}catch(DBQueryNoRowsException e){
				
			}catch(DBException e){
				logger.error("error in setExceptionForSelect() : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}finally{
				try{
					db.close();
				}catch (DBException e) {
					logger.error("error in setExceptionForSelect() while closing db connection : "+e.getMessage());
					ActionErrors actionErrors = new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
					throw new ShfException(actionErrors);
				}
			} 
		}// end else
		forecastForm.setExceptionsForSelect(strExcep);
	}

	public Vector sumSchData(Vector dataVector) throws ShfException{
		
		Vector sumData = new Vector();
		if (dataVector != null && dataVector.size()>0) {
			HashMap hmData = getHmData(dataVector);
			sumData = getSumSchData(hmData);
		}
	return sumData;
	}

	private Vector getSumSchData(HashMap hmData) throws ShfException{
		logger.debug("Starting getSumSchData()");
		Vector<AgentDayBean> allMokedSwitches = null;
		if ("moked".equals(forecastForm.getRbChoice())){
		// -- START Moked switching details ---- Igal 5.2013
		StringBuffer sqlAllMokedSwitches = new StringBuffer();
		int param = 1;
		sqlAllMokedSwitches.append("SELECT DISTINCT p.first_name, p.last_name, "); 
		sqlAllMokedSwitches.append("c2.new_shift_start AS wm_shift_start_datetime, c2.new_shift_end AS wm_shift_end_datetime,  ");
		sqlAllMokedSwitches.append("e.first_name AS SWITCHED_FIRST_NAME, e.last_name AS SWITCHED_LAST_NAME, ");
		sqlAllMokedSwitches.append("s.site_name AS SITE_NAME, s.site_id, c.new_shift_start, c.new_shift_end ");
		sqlAllMokedSwitches.append("FROM shifter.shf_day_changes c ");
		sqlAllMokedSwitches.append("LEFT JOIN shifter.shf_employee_day d ON d.emp_id_number = c.new_employee_id ");
		sqlAllMokedSwitches.append("LEFT JOIN shifter.shf_day_changes c2 ON c2.shf_employee_day_id = c.switch_day_id ");
		sqlAllMokedSwitches.append("LEFT JOIN shifter.shf_employees e ON  substr(e.emp_id_number,1,8) = c2.new_employee_id "); 
		sqlAllMokedSwitches.append("LEFT JOIN shifter.shf_employees p ON  substr(p.emp_id_number,1,8) = c.new_employee_id ");
		sqlAllMokedSwitches.append("LEFT JOIN shifter.shf_site s ON s.site_id = c2.new_site_id ");  
		sqlAllMokedSwitches.append("WHERE (TO_CHAR(c.new_shift_start,'dd/mm/yyyy') = ? OR TO_CHAR(c.new_shift_end,'dd/mm/yyyy') = ? ) "); // 1+2 
		sqlAllMokedSwitches.append("AND c.new_site_id = ? ");  //3
		sqlAllMokedSwitches.append("AND c2.new_site_id <> ? "); //4
		sqlAllMokedSwitches.append("AND c.new_day_type = ? "); //5
		sqlAllMokedSwitches.append("ORDER BY e.first_name, e.last_name "); 

		DBAccess db = new DBAccess();
		String DateStr = SHFUtils.formatDateToString(forecastForm.getDate(), "dd/MM/yyyy");
		try {
			db.prepareStatement(sqlAllMokedSwitches.toString());
			db.setString	(param++, DateStr); // 1
			db.setString	(param++, DateStr); // 2
			db.setInt		(param++, Integer.parseInt( SHFTableUtils.getSiteCodeOfUnit(forecastForm.getMoked()))); // 3
			db.setInt		(param++, Integer.parseInt( SHFTableUtils.getSiteCodeOfUnit(forecastForm.getMoked()))); // 4
			db.setInt		(param++, SHFConstants.DAY_TYPE_ACTIVITY); // 5
			db.executeQuery();
			allMokedSwitches = new Vector<AgentDayBean>();
			db.populate("bzq.shf.bean.AgentDayBean",allMokedSwitches);
		}catch(DBQueryNoRowsException e){
		}
		catch(DBException e){
			logger.error("General DB error in getSumSchData() moked switches sql : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try{
				db.close();
			}catch (DBException e) {
				logger.error("error in getSumSchData() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		
		// -- END Moked switching details ----
		}
		
		Vector sumData = new Vector();
		
		for(Date i=new Date(dateFrom.getTime());i.before(dateTo);){
	
			ForecastSchedualBean q0=(ForecastSchedualBean)hmData.get(BaseConvert.dateToString(i,"HH:mm"));
			i.setTime(i.getTime()+15*60*1000);
			ForecastSchedualBean q1=(ForecastSchedualBean)hmData.get(BaseConvert.dateToString(i,"HH:mm"));
			i.setTime(i.getTime()+15*60*1000);
			ForecastSchedualBean q2=(ForecastSchedualBean)hmData.get(BaseConvert.dateToString(i,"HH:mm"));
			i.setTime(i.getTime()+15*60*1000);
			ForecastSchedualBean q3=(ForecastSchedualBean)hmData.get(BaseConvert.dateToString(i,"HH:mm"));
			i.setTime(i.getTime()+15*60*1000);
	
			if(q0!=null && q1!=null && q2!=null && q3!=null){
				ForecastSchedualBean rowMaster=new ForecastSchedualBean();
				rowMaster.setTime(q0.getTime());
				rowMaster.setAfterChanges( (q0.getAfterChanges()+q1.getAfterChanges()+q2.getAfterChanges()+q3.getAfterChanges()) /4);
				rowMaster.setArrivals( (q0.getArrivals()+q1.getArrivals()+q2.getArrivals()+q3.getArrivals()) );
				rowMaster.setFutureExit( (q0.getFutureExit()+q1.getFutureExit()+q2.getFutureExit()+q3.getFutureExit()) );
				rowMaster.setBreakExcepSHF( ((q0.getBreakExcepSHF()+q1.getBreakExcepSHF()+q2.getBreakExcepSHF()+q3.getBreakExcepSHF()) /4));
				rowMaster.setBreakExcepWFM( ((q0.getBreakExcepWFM()+q1.getBreakExcepWFM()+q2.getBreakExcepWFM()+q3.getBreakExcepWFM()) /4));
				rowMaster.setDifference( ((q0.getDifference()+q1.getDifference()+q2.getDifference()+q3.getDifference()) /4));
				rowMaster.setExceptionsSHF( ((q0.getExceptionsSHF()+q1.getExceptionsSHF()+q2.getExceptionsSHF()+q3.getExceptionsSHF()) /4));
				rowMaster.setExceptionsWFM( ((q0.getExceptionsWFM()+q1.getExceptionsWFM()+q2.getExceptionsWFM()+q3.getExceptionsWFM()) /4));
				rowMaster.setInExtraHours( ((q0.getInExtraHours()+q1.getInExtraHours()+q2.getInExtraHours()+q3.getInExtraHours()) /4));
				rowMaster.setLate( ((q0.getLate()+q1.getLate()+q2.getLate()+q3.getLate()) /4));
				rowMaster.setMarked( ((q0.getMarked()+q1.getMarked()+q2.getMarked()+q3.getMarked()) /4));
				rowMaster.setMissing( ((q0.getMissing()+q1.getMissing()+q2.getMissing()+q3.getMissing()) /4));
				rowMaster.setNotMarked( ((q0.getNotMarked()+q1.getNotMarked()+q2.getNotMarked()+q3.getNotMarked()) /4));
				rowMaster.setRequiredStaffing( ((q0.getRequiredStaffing()+q1.getRequiredStaffing()+q2.getRequiredStaffing()+q3.getRequiredStaffing()) /4));
				rowMaster.setShebotsMoked( ((q0.getShebotsMoked()+q1.getShebotsMoked()+q2.getShebotsMoked()+q3.getShebotsMoked()) /4));
				rowMaster.setTekhnonMaty( ((q0.getTekhnonMaty()+q1.getTekhnonMaty()+q2.getTekhnonMaty()+q3.getTekhnonMaty()) /4));
				rowMaster.setCancelled( ((q0.getCancelled()+q1.getCancelled()+q2.getCancelled()+q3.getCancelled()) /4));
				rowMaster.setShortening((q0.getShortening()+q1.getShortening()+q2.getShortening()+q3.getShortening())/4);
				rowMaster.setExtension((q0.getExtension()+q1.getExtension()+q2.getExtension()+q3.getExtension())/4);
				rowMaster.setShifting((q0.getShifting()+q1.getShifting()+q2.getShifting()+q3.getShifting())/4);
				
//				sumMokedCalls(localActivies,rowMaster,q0.getMokedCallLengthList(),q1.getMokedCallLengthList(),q2.getMokedCallLengthList(),q3.getMokedCallLengthList());
				
					double sumAll = rowMaster.getTekhnonMaty() + rowMaster.getRequiredStaffing() + rowMaster.getShebotsMoked() 
									+ rowMaster.getBreakExcepWFM() + rowMaster.getBreakExcepSHF() + rowMaster.getExceptionsWFM() 
									+ rowMaster.getExceptionsSHF() + rowMaster.getArrivals() + rowMaster.getAfterChanges() 
									+ rowMaster.getInExtraHours() + rowMaster.getNotMarked() + rowMaster.getMarked() + rowMaster.getMissing()
									+ rowMaster.getLate() + rowMaster.getCancelled() + rowMaster.getFutureExit() + rowMaster.getSum();
				
				if (sumAll!=0) {
					
					getMokedSwitchDetails(rowMaster, allMokedSwitches );
					sumData.add(rowMaster);
					sumData.add(q0);
					sumData.add(q1);
					sumData.add(q2);
					sumData.add(q3);
				}
			}
		
		
		}
		return sumData;
	}
	private HashMap getHmData(Vector data) throws ShfException{
		
		HashMap hmData = new HashMap();
		ForecastSchedualBean forecastSchedualBean = null;
		//TODO - check null
		for (int i=0; i<data.size();i++) {
			forecastSchedualBean = new ForecastSchedualBean();
			forecastSchedualBean = ((ForecastSchedualBean)data.get(i));
			hmData.put(BaseConvert.dateToString(forecastSchedualBean.getTime(),"HH:mm"), forecastSchedualBean);
		}
		return hmData;
	}
	
	private void getMokedSwitchDetails(ForecastSchedualBean rowMaster, Vector<AgentDayBean> allMokedSwitches){ // Igal 5.2013
		logger.debug("Starting getMokedSwitchDetails()");
			Vector <AgentDayBean> vecMokedSwitchesLeft = new Vector <AgentDayBean>();
			Vector <AgentDayBean> vecMokedSwitchesArrived = new Vector <AgentDayBean>();
			
			if(  allMokedSwitches != null && allMokedSwitches.size() > 0) {
				for (AgentDayBean dayBean : allMokedSwitches){
					try{
						if ( ! ( ((rowMaster.getTime().after(dayBean.getWmShiftStartTime()) || rowMaster.getTime().equals(dayBean.getWmShiftStartTime()))
								&& rowMaster.getTime().before(dayBean.getWmShiftEndTime()))
							 && ((rowMaster.getTime().after(dayBean.getNewShiftStart()) || rowMaster.getTime().equals(dayBean.getNewShiftStart()))
								&& rowMaster.getTime().before(dayBean.getNewShiftEnd())))
							 // if date NOT in range of EMP_DAYS and EMP_CHANGES shifts simultaneously
						){	// then :
							if(	( (rowMaster.getTime().after(dayBean.getWmShiftStartTime()) || rowMaster.getTime().equals(dayBean.getWmShiftStartTime()))
									&& rowMaster.getTime().before(dayBean.getWmShiftEndTime()))
									 && ! ((( rowMaster.getTime().after(dayBean.getNewShiftStart()) || rowMaster.getTime().equals(dayBean.getNewShiftStart())
											 ) && (rowMaster.getTime().before(dayBean.getNewShiftEnd())  )  ))
									){ // if in range of original (EMP_DAYS) shift but NOT in EMP_CHANGES shift
		
											vecMokedSwitchesLeft.add(dayBean);
									} // END if
							else if ( ! ((rowMaster.getTime().after(dayBean.getWmShiftStartTime()) || rowMaster.getTime().equals(dayBean.getWmShiftStartTime()))
									&& rowMaster.getTime().before(dayBean.getWmShiftEndTime()))
									 &&  (( rowMaster.getTime().after(dayBean.getNewShiftStart()) || rowMaster.getTime().equals(dayBean.getNewShiftStart()))
											 && rowMaster.getTime().before(dayBean.getNewShiftEnd()))
									 ){ // if NOT in range of original (EMP_DAYS) shift but in EMP_CHANGES shift
		
										vecMokedSwitchesArrived.add(dayBean);
									} // END if
						}else{
						}
					}catch(Exception e){ // if one the time values is null skip to next iteration
						continue;
					}
				} // END for
			}
			
			rowMaster.setVecMokedSwitchesLeft(vecMokedSwitchesLeft);
			rowMaster.setVecMokedSwitchesArrived(vecMokedSwitchesArrived);
	} // END method
} // END class
