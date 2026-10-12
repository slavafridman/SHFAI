package bzq.wfm.report;

import java.util.Calendar;
import java.util.Date;
import java.util.Hashtable;

import org.apache.log4j.Logger;

import bzq.shf.actions.AttendanceDataAction;
import bzq.shf.bean.AgentDayBean;
import bzq.shf.utils.SHFUtils;


public class ScheduleReport {
	
	private Logger logger = Logger.getLogger(AttendanceDataAction.class);
	protected short[][][] shiftsLength; // number of entries per dayOfWeek X hourOfDay X shiftLength
	protected short[][] forecast; // calls forecast for each dayOfWeek X hourOfDay
	protected short[][] netoNeeded; // neto agents needed per dayOfWeek X hourOfDay
	protected float[][] breaks; // sum of breaks in each dayOfWeek X hourOfDay
	protected float[][] exceptions; // sum of exceptions in each dayOfWeek X hourOfDay
	protected float[][] tamheel; // summury of each shiftLength / shiftsCount
	protected float[][] summury; // number of shifts for each dayOfWeek X shiftLength
	protected String activityName; // the activity description for the current week report
	protected String sheetName;
	protected short[] shiftsCount; // all shifts number for each day in the week
	final static int HIEGHT=110;
	final static int DAY_WIDTH=19;
	final static int MAX_ROWS=96;
	protected String title;
	protected short[][] proto; // proto agents 
	
	Hashtable<String,ScheduleReport> siteActivitiesReports;
	
	private Calendar cal=null;
	
	
	public ScheduleReport(){
		//8 reports , because it includes the weekly summary
		shiftsLength=new short[8][96][7]; 
		forecast=new short[8][96]; 
		netoNeeded=new short[8][96]; 
		breaks=new float[8][96];
		exceptions=new float[8][96];
		shiftsCount=new short[8];
		tamheel=new float[8][7];  
		summury=new float[8][7];  
		proto=new short[8][96]; 
		siteActivitiesReports=new Hashtable<String,ScheduleReport>();
		cal=Calendar.getInstance();
	}
	

	public short[][][] getShiftsLength() {
		return shiftsLength;
	}


	public void setShiftsLength(short[][][] shiftsLength) {
		this.shiftsLength = shiftsLength;
	}


	public short[][] getForecast() {
		return forecast;
	}


	public void setForecast(short[][] forecast) {
		this.forecast = forecast;
	}


	public short[][] getNetoNeeded() {
		return netoNeeded;
	}


	public void setNetoNeeded(short[][] netoNeeded) {
		this.netoNeeded = netoNeeded;
	}


	public float[][] getExceptions() {
		return exceptions;
	}


	public void setExceptions(float[][] exceptions) {
		this.exceptions = exceptions;
	}


	public String getActivityName() {
		return activityName;
	}

	
	public void setActivityName(String activityName) {
		this.activityName = activityName;
	}
	
	
	public void setTitle(String str){
		this.title=str;
	}
	
	public String getTitle(){
		return title;
	}
	
	
	public float[][] getBreaks() {
		return breaks;
	}


	public void setBreaks(float[][] breaks) {
		this.breaks = breaks;
	}


	public short[][] getProto() {
		return proto;
	}


	public void setProto(short[][] proto) {
		this.proto = proto;
	}

	
	public float[][] getTamheel() {
		return tamheel;
	}


	public void setTamheel(float[][] tamheel) {
		this.tamheel = tamheel;
	}


	public float[][] getSummury() {
		return summury;
	}


	public void setSummury(float[][] summury) {
		this.summury = summury;
	}



	public Hashtable<String, ScheduleReport> getSiteActivitiesReports() {
		return siteActivitiesReports;
	}


	public void setSiteActivitiesReports(
			Hashtable<String, ScheduleReport> siteActivitiesReports) {
		this.siteActivitiesReports = siteActivitiesReports;
	}

	
	public float[] getDiffAvg(){
		float[] sum=new float[]{0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f};
		for(int day=0;day<7;day++){
			int i=0;
			for(int h=0;h<24;h++){
				
				float tmp=0.0f;
				for(int k=0;k<4;k++){
					i=(4*h)+k;
					tmp+=(proto[day][i]-(breaks[day][i]+exceptions[day][i])) - netoNeeded[day][i];
				}
				sum[day]+= (tmp/4);	
			}
		}
		return sum;
	}

	/**
	 * handle a single day data
	 * @param dayBean
	 */
	public void handleDay(WFMReport report, AgentDayBean dayBean){
		updateShiftLength(dayBean);
		updateBreakAndExceptions(report,dayBean);
		updateProto(dayBean);
	}
	
	
	/**
	 * handle a single day data
	 * @param dayBean
	 */
	public void handleDayInSiteActivity(WFMReport report, AgentDayBean dayBean){
		String virtualActivityCode=dayBean.getVirtualActivity();
		if(virtualActivityCode!=null){
			ScheduleReport activityReport=siteActivitiesReports.get(virtualActivityCode);
			if(activityReport!=null){
				activityReport.handleDay(report, dayBean);
			}else{
				activityReport=new ScheduleReport();
				activityReport.handleDay(report, dayBean);
				siteActivitiesReports.put(virtualActivityCode, activityReport);
			}
		}
	}
	
	
	private void updateBreakAndExceptions(WFMReport report,AgentDayBean dayBean){
		String stateData=dayBean.getStateData();
		if(stateData!=null && stateData.length()>0){
			String states[]=stateData.split("\\n");
			String breakProps[]=null;
			int dayIndex=-1;
			for(int i=0;i<states.length;i++){
				
				if(states[i]!=null){
					breakProps=states[i].split(";");
					if(breakProps!=null && breakProps.length==6){
						int minStart=Integer.parseInt(breakProps[2]);
						int minEnd=Integer.parseInt(breakProps[3]);
						Calendar cal=Calendar.getInstance();
						cal.setTime(dayBean.getDate());
						cal.set(Calendar.HOUR_OF_DAY,0);
						cal.set(Calendar.MINUTE,0);
						cal.set(Calendar.SECOND,0);
						cal.set(Calendar.MILLISECOND,0);
						cal.add(Calendar.MINUTE, minStart);
						if(cal.getTime().after(report.getScheduleEnd())){
							continue;
						}
							
						//Date start=cal.getTime();
						int dayOfWeek=cal.get(Calendar.DAY_OF_WEEK);
						dayIndex=dayOfWeek-1;
						
						ActivityPart[] parts=getActivityParts(cal, minEnd-minStart);
						
						if(parts!=null && parts.length>0){
							for(int p=0;p<parts.length;p++){
								int hour=parts[p].hour;
								if(hour<MAX_ROWS){							
									if("4".equals(breakProps[0])){
										breaks[dayIndex][hour]+=parts[p].part;
										breaks[7][hour]+=parts[p].part; // add breaks to the weekly summary
										
										
									}else if("3".equals(breakProps[0])){
										exceptions[dayIndex][hour]+=parts[p].part;
										exceptions[7][hour]+=parts[p].part; // add breaks to the weekly summary
									}
								}
								//if break is starting one day and ending the next day.
								else if(dayIndex<6){
									if("4".equals(breakProps[0])){
										breaks[dayIndex+1][hour-MAX_ROWS]+=parts[p].part;
										breaks[7][hour-MAX_ROWS]+=parts[p].part; // add breaks to the weekly summary
									}else if("3".equals(breakProps[0])){
										exceptions[dayIndex+1][hour-MAX_ROWS]+=parts[p].part;
										exceptions[7][hour-MAX_ROWS]+=parts[p].part; // add breaks to the weekly summary
									}
								}
							}
													
						}
						
					}
					
				}
			}
		}
	}

	
	/**
	 * update the length array according to the dayBean start time and length
	 * @param dayBean
	 */
	private void updateShiftLength(AgentDayBean dayBean){
		int dayIndex=-1,hour=-1,lengthIndex=-1;
		Date shiftStart=dayBean.getWmShiftStartTime();
		Date shiftEnd=dayBean.getWmShiftEndTime();
		if ( shiftStart != null ) {
			cal.setTime(shiftStart);
			int dayOfWeek=cal.get(Calendar.DAY_OF_WEEK);
			dayIndex=dayOfWeek-1;
			
			hour=getHourIndex(cal);
			
			int lengthMinutes=SHFUtils.getMinutesBetween(shiftStart, shiftEnd);
			lengthIndex=(int)lengthMinutes/60;
			if(lengthIndex<4){
				lengthIndex=4;
			}
			if(lengthIndex>10){
				lengthIndex=10;
			}
			
			lengthIndex-=4;
			
			if(dayIndex>=0 && hour>=0 && lengthIndex>=0){
				shiftsCount[dayIndex]++;
				
				shiftsLength[dayIndex][hour][lengthIndex]++;
				shiftsLength[7][hour][lengthIndex]++; //add each shift length to the weekly summary
				
				summury[dayIndex][lengthIndex]++;
				summury[7][lengthIndex]++; //add each shift length to the weekly summary
				
				tamheel[dayIndex][lengthIndex]=summury[dayIndex][lengthIndex]/shiftsCount[dayIndex];
				tamheel[7][lengthIndex]=summury[dayIndex][lengthIndex]/shiftsCount[dayIndex]; //add each shift length to the weekly summary
				
			}else{
				System.out.println("error adding day");
			}
		} else {
			logger.error("error in updateShiftLength(), \"shiftStart\" is NULL  ");
//			System.out.println("shiftStart IS NULL !"+dayBean.getAgentDayId());
		}
	}
	
	/**
	 * update proto columns
	 * calculated by increasing each row (hour) affected by the day given
	 * rowsAffectedByShift = lengthMinutes/15
	 * @param dayBean
	 */
	private void updateProto(AgentDayBean dayBean){
		int dayIndex=-1,hour=-1;
		Date shiftStart=dayBean.getWmShiftStartTime();
		Date shiftEnd=dayBean.getWmShiftEndTime();
		if ( shiftStart != null ) {
			cal.setTime(shiftStart);
			int dayOfWeek=cal.get(Calendar.DAY_OF_WEEK);
			dayIndex=dayOfWeek-1;
			
			hour=getHourIndex(cal);
			
			int lengthMinutes=SHFUtils.getMinutesBetween(shiftStart, shiftEnd);
			int rowsAffectedByShift=lengthMinutes/15;
			if(dayIndex>=0 && hour>=0){
				for(int i=0;i<rowsAffectedByShift ;i++){
					proto[dayIndex][hour+i]++;
					proto[7][hour+i]++;
					
					//in case proto is affecting next day column
					if((hour+i)==MAX_ROWS-1){
						if(dayIndex<6){
							for(int j=0;j<(rowsAffectedByShift-i) ;j++){
								proto[dayIndex+1][j]++;
								proto[7][j]++;
							}
						}
						break;
					}
				}
			}
		} else {
			logger.error("error in updateProto(), \"shiftStart\" is NULL  ");
		}
	}
	
	
	private int getHourIndex(Calendar cal){
		int index=cal.get(Calendar.HOUR_OF_DAY);
		int minutes=cal.get(Calendar.MINUTE);
		
		index*=4;
		int quarters=(int)minutes/15;
		index+=quarters;
		
		return index;
	}
	
	
	private ActivityPart[] getActivityParts(Calendar startTime,int length){
		ActivityPart[] parts=null;
		int firstPartHour=getHourIndex(startTime);
		
		int partsNumber=length/15;
		
		int minStart=startTime.get(Calendar.MINUTE);
		
		boolean partialStart=false, partialEnd=false;
		int i=0;
		if(minStart%15>0 ){
			partsNumber++;
			i++;
			partialStart=true;
		}
		int j=partsNumber;
		if((length+minStart)%15>0){
			int tmp1=(length+minStart)%15;
			int tmp2=minStart%15;
			if(tmp1+tmp2 < 15){
				partsNumber++;
			}
			partialEnd=true;
			j=partsNumber-1;
		}
		
		parts=new ActivityPart[partsNumber];
		if(partialStart){
			parts[0]=new ActivityPart();
			parts[0].hour=firstPartHour;
			parts[0].part=(float)((15.0-(minStart%15))/15.0);
		}
		
		if(partialEnd){
			parts[partsNumber-1]=new ActivityPart();
			parts[partsNumber-1].hour=firstPartHour+partsNumber-1;
			parts[partsNumber-1].part=(float)(((minStart+length)%15)/15.0);
		}
		
		for(;i<j;i++){
			parts[i]=new ActivityPart();
			parts[i].hour=firstPartHour+i;
			parts[i].part=1;
		}
		
		return parts;
	}
	
	
	public void addForecastData(short[] required,short[] calculated,Date date,String activity){
		Calendar c=Calendar.getInstance();
		c.setTime(date);
		int dayIndex=c.get(Calendar.DAY_OF_WEEK)-1;
		for(int i=0;i<96;i++){
			forecast[dayIndex][i]+=calculated[i];
			netoNeeded[dayIndex][i]+=required[i];
			forecast[7][i]+=calculated[i];
			netoNeeded[7][i]+=required[i];
		}
		
		if(activity!=null && siteActivitiesReports!=null){
			ScheduleReport siteActivityReport=siteActivitiesReports.get(activity);
			if(siteActivityReport!=null){
				siteActivityReport.addForecastData(required, calculated, date, null);
			}
		}
	}
	
	/*
	private void updateActivity(AgentDayBean dayBean){
		activityName=dayBean.getWmActivityId();
	}
	*/
	
	class ActivityPart{
		protected int hour;
		protected float part;
	}
	
}
