package bzq.wfm.report;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Hashtable;
import java.util.Set;

import org.apache.log4j.Logger;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.forms.TableForm;
import bzq.shf.bean.AgentDayBean;
import bzq.shf.forms.ActivityForm;
import bzq.shf.utils.SHFTableUtils;

public class ScheduleReportModel {
	
	private static Logger logger = Logger.getLogger(ScheduleReportModel.class);
	public static ArrayList<TableForm> getAvailableSchedules(){
		ArrayList<TableForm> list=null;
		DBAccess db= null;
		try{
			db=new DBAccess("wfm");
			db.prepareStatement("select t.wm_schedule_id as CODE, t.wm_name as DESCRIPTION from wm_schedules t order by t.wm_name ");
			db.executeQuery();			
			list=new ArrayList<TableForm>();
			TableForm schedule=null;
			while(db.next()){
				schedule=new TableForm();
				db.populate(schedule);
				list.add(schedule);
			}
			
		}catch (DBQueryNoRowsException e) {
			
		}catch (Exception e) {
			logger.error(e);
		}finally{
			if(db!=null){
				try {
					db.close();
				} catch (DBException e) {
					logger.error(e);
				}
			}
		}
		return list;
	}
	
	
	public static ArrayList<TableForm> getAvailableForecasts(String scheduleId){
		ArrayList<TableForm> list=null;
		DBAccess db= null;
		StringBuffer str=new StringBuffer();
		str.append("select f.wm_forecast_id as CODE, f.wm_name as DESCRIPTION from wm_forecasts f where f.wm_status>0 ");
		str.append("and f.wm_start_date = (select t.wm_start_date from wm_schedules t where t.wm_schedule_id=?) ");
		str.append("and f.wm_end_date = (select t.wm_end_date from wm_schedules t where t.wm_schedule_id=?) order by f.wm_name ");
		
		try{
			db=new DBAccess("wfm");
			db.prepareStatement(str.toString());
			db.setString(1, scheduleId);
			db.setString(2, scheduleId);
			db.executeQuery();			
			list=new ArrayList<TableForm>();
			TableForm schedule=null;
			while(db.next()){
				schedule=new TableForm();
				db.populate(schedule);
				list.add(schedule);
			}
			
		}catch (DBQueryNoRowsException e) {
			
		}catch (Exception e) {
			logger.error(e);
		}finally{
			if(db!=null){
				try {
					db.close();
				} catch (DBException e) {
					logger.error(e);
				}
			}
		}
		return list;
	}
	
	
	public static ArrayList<AgentDayBean> getDays(String scheduleId,String siteId){
		ArrayList<AgentDayBean> list=null;
		StringBuffer str=new StringBuffer();
		str.append("select t.gsw_agent_id EMP_ID_NUMBER, t.wm_start_datetime WM_SHIFT_START_DATETIME, ");
		str.append("t.wm_end_datetime WM_SHIFT_END_DATETIME, ");
		str.append("t.wm_site_id WM_SITE_ID, ");
		str.append("t.WM_SCH_ACTIVITY_ID_DATA WM_SCH_ACTIVITY_ID_DATA, ");
		str.append("t.WM_SCH_STATE_DATA WM_SCH_STATE_DATA, ");
		str.append("t.WM_DATE WM_DATE, ");
		str.append("t.WM_WORK_MINUTES ");
		str.append("FROM wm_schedule_days t WHERE t.wm_schedule_id=? ");//AND t.wm_day_type=4");
		if(siteId!=null && !"0".equals(siteId)){
			str.append("AND t.wm_site_id=? ");
		}
		DBAccess db= null;
		try{
			db=new DBAccess("wfm");
			db.prepareStatement(str.toString());
			db.setString(1,scheduleId);
			if(siteId!=null && !"0".equals(siteId)){
				db.setString(2,siteId);
			}
			db.executeQuery();			
			list=new ArrayList<AgentDayBean>();
			AgentDayBean day=null;
			while(db.next()){
				day=new AgentDayBean();
				db.populate(day);
				list.add(day);
			}
			
		}catch (DBQueryNoRowsException e) {
			
		}catch (Exception e) {
			logger.error(e);
		}finally{
			if(db!=null){
				try {
					db.close();
				} catch (DBException e) {
					logger.error(e);
				}
			}
		}
		return list;
	}
	
	
	/**
	 * get schedule data
	 */
	public static void getScheduleData(WFMReport report,String scheduleId){
		Hashtable<String, ScheduleReport> sites=new Hashtable<String, ScheduleReport>();
		//Hashtable<String, ScheduleReport> activities=new Hashtable<String, ScheduleReport>();
		Hashtable<String, ScheduleReport> virtualActivities=new Hashtable<String, ScheduleReport>();
		DBAccess db= null;
		try{
			db=new DBAccess("wfm");
			if(report.getSite()==null ){
				
				try{
					db.prepareStatement("select s.wm_site_id,s.wm_name from wm_sch_sites t left join wm_sites s on s.wm_site_id=t.wm_site_id where t.wm_schedule_id=?");		
					db.setString(1,scheduleId);
					db.executeQuery();
					while(db.next()){
						String code=db.getString(1);
						String desc=db.getString(2);
						
						ScheduleReport sch=new ScheduleReport();
						sch.setTitle(desc);
						sites.put(code,sch);
					}
					
				}catch (DBQueryNoRowsException e) {
					logger.error(e);
				}
			}else{
				ScheduleReport sch=new ScheduleReport();
				TableForm site=report.getSite();
				sch.setTitle(site.getDescription());
				sites.put(site.getCode(),sch);
			}
			report.setSitesReports(sites);
			/*
			try{
				db.prepareStatement("select a.wm_activity_id,a.wm_name from wm_sch_activities t left join wm_activities a on a.wm_activity_id=t.wm_activity_id where t.wm_schedule_id=?");
				db.setString(1,scheduleId);
				db.executeQuery();
				while(db.next()){
					String code=db.getString(1);
					String desc=db.getString(2);
					ScheduleReport sch=new ScheduleReport();
					sch.setTitle(desc);
					activities.put(code,sch);
				}
				report.setActivitiesReports(activities);
			}catch (DBQueryNoRowsException e) {
				
			}*/
			try{
				db.prepareStatement("select t.wm_name, t.wm_start_date, t.wm_end_date from wm_schedules t where t.wm_schedule_id=?");
				db.setString(1,scheduleId);
				db.executeQuery();
				if(db.next()){
					report.setScheduleId(scheduleId);
					report.setScheduleName(db.getString(1));
					report.setScheduleStart(db.getDate(2));
					Calendar cal=Calendar.getInstance();
					cal.setTime(db.getDate(3));
					cal.set(Calendar.HOUR_OF_DAY,0);
					cal.set(Calendar.MINUTE,0);
					cal.set(Calendar.SECOND,0);
					cal.set(Calendar.MILLISECOND,0);
					cal.add(Calendar.DATE,1);
					report.setScheduleEnd(cal.getTime());
					
				}
			}catch (DBQueryNoRowsException e) {
				
			}
			
			try{
				StringBuffer str=new StringBuffer();
				str.append("select e.wm_activity_id,e.wm_name from wm_activities e where e.wm_activity_id in ");
				str.append("(select a.wm_virtual_activity_id from wm_sch_activities t  ");
				str.append("left join wm_activities a on a.wm_activity_id=t.wm_activity_id ");
				str.append("where t.wm_schedule_id=? and a.wm_virtual_activity_id is not null ");
				str.append("group by a.wm_virtual_activity_id) ");
				
				db.prepareStatement(str.toString());
				db.setString(1,scheduleId);
				db.executeQuery();
				while(db.next()){
					String code=db.getString(1);
					String desc=db.getString(2);
					ScheduleReport sch=new ScheduleReport();
					sch.setTitle(desc);
					virtualActivities.put(code,sch);
				}
				report.setVirtualActivitiesReports(virtualActivities);
			}catch (DBQueryNoRowsException e) {
				
			}
			
		}catch (Exception e) {
			logger.error(e);
		}finally{
			if(db!=null){
				try {
					db.close();
				} catch (DBException e) {
					logger.error(e);
				}
			}
		}
	}
	
	
	
	public static void getForecast(WFMReport report,String forecastId){
		ArrayList<ForecastReportDayBean> array=new ArrayList<ForecastReportDayBean>();
		DBAccess db= null;
		try{
			db=new DBAccess("wfm");
			db.prepareStatement("select t.wm_name from wm_forecasts t where t.wm_forecast_id=?");
			db.setString(1, forecastId);
			db.executeQuery();
			if(db.next()){
				report.setForecastName(db.getString(1));
			}
			
			StringBuffer str=new StringBuffer();
			str.append("SELECT f.wm_date,f.wm_required_staffing,f.wm_calculated_staffing,a.wm_site_id,v.wm_activity_id ");
			str.append("FROM wm_forecast_data f ");
			str.append("left join wm_forecast_activities t on t.wm_forecast_activity_id=f.wm_forecast_activity_id ");
			str.append("left join wm_activities a  on t.wm_activity_id=a.wm_activity_id ");
			str.append("left join wm_activities v  on v.wm_activity_id=a.wm_virtual_activity_id ");
			str.append("where a.wm_virtual_activity_id is not null ");
			str.append("and t.wm_forecast_id=? ");
			if(report.getSite()!=null){
				str.append("and a.wm_site_id = ? ");
			}
			db.prepareStatement(str.toString());
			db.setString(1, forecastId);
			if(report.getSite()!=null){
				db.setString(2, report.getSite().getCode());
			}
			db.executeQuery();
			ForecastReportDayBean forecastReportDayBean=null;
			while(db.next()){
				forecastReportDayBean=new ForecastReportDayBean();
				db.populate(forecastReportDayBean);
				array.add(forecastReportDayBean);
			}
		}catch (DBQueryNoRowsException e) {
			
		}catch (Exception e) {
			logger.error(e);
		}finally{
			if(db!=null){
				try {
					db.close();
				} catch (DBException e) {
					logger.error(e);
				}
			}
		}
		report.setForecastData(array);
	}
	
	


	public static WFMReport createReport(WfmReportForm wfmReportForm,ArrayList<TableForm> sites) throws Exception{
		
		WFMReport report=new WFMReport();
		
		String scheduleId=wfmReportForm.getScheduleId();
		String forecastId=wfmReportForm.getForecastId();
		String siteId=wfmReportForm.getSiteId();
		
		if(sites!=null && !"0".equals(siteId)){
			for(TableForm site:sites){
				if(site.getCode().equals(siteId)){
					report.setSite(site);
				}
			}
		}
		
		ScheduleReport schReportArtsi=new ScheduleReport();
		
		//set activities and sites
		getScheduleData(report,scheduleId);
		//set forecast data
		getForecast(report,forecastId);
		
		Hashtable<String, TamheelReport> tamheel=new Hashtable<String, TamheelReport>();
		Hashtable<String, ScheduleReport> sitesReports=report.getSitesReports();
		//Hashtable<String, ScheduleReport> activitiesReports=report.getActivitiesReports();
		Hashtable<String, ScheduleReport> virtualActivitiesReports=report.getVirtualActivitiesReports();
		
		
		// get relevant activities that should be taken into consideration in the report
		Set<String> consideredActivities=getRelevantActivities();
		if(consideredActivities==null || consideredActivities.size()==0){
			throw new Exception("schedule report activities table empty");
		}
		
		ArrayList<AgentDayBean> days=getDays(scheduleId,siteId);
		
		
		
		if(days!=null){
			for(AgentDayBean day:days){
				
				String siteCode=day.getSiteId();
				
				//handle tamheel in case of non working day
				
				TamheelReport tamheelReport=tamheel.get(siteCode);
				if(tamheelReport!=null){
					tamheelReport.handleDay(day);
				}else{
					tamheelReport=new TamheelReport();
					tamheelReport.handleDay(day);
					tamheel.put(siteCode, tamheelReport);
				}
				
				if(day.getWmWorkMinutes()==0){
					//in case a non working day , all other calculations are not relevant
					continue;
				}
				
				
				String activityCode=day.getShiftActivity();
				activityCode=SHFTableUtils.getActivityCodeWithoutColon(activityCode);
				
				
				
				String virtualActivityCode=null;
				ActivityForm activityForm=SHFTableUtils.getActivityByCode(activityCode);
				if(activityForm!=null){
					virtualActivityCode=activityForm.getVirtualActivity();
				}
				day.setVirtualActivity(virtualActivityCode);
				
				/////////////////
				//if the activity is not in the schdule report activities table, 
				//do not handle the current day in artsi tab
				if(consideredActivities.contains(activityCode)){
					schReportArtsi.handleDay(report,day);
				}
								
				//////////////////
				
				
				//// handle schedule report for each site
				ScheduleReport schReportSite=sitesReports.get(siteCode);
				if(schReportSite!=null){
					schReportSite.handleDay(report,day);
					schReportSite.handleDayInSiteActivity(report,day);
				}else{
					schReportSite=new ScheduleReport();
					schReportSite.handleDay(report,day);
					schReportSite.handleDayInSiteActivity(report,day);
					sitesReports.put(siteCode, schReportSite);
				}
				
				
				
				
				
				////////////
				/*
				ScheduleReport schReportActivity=activitiesReports.get(activityCode);
				if(schReportActivity!=null){
					schReportActivity.handleDay(day);
				}else{
					schReportActivity=new ScheduleReport();
					schReportActivity.handleDay(day);
					activitiesReports.put(activityCode, schReportActivity);
				}
				*/
				////////////
				
				if(virtualActivityCode!=null){
					ScheduleReport schReportVirtualActivity=virtualActivitiesReports.get(virtualActivityCode);
					if(schReportVirtualActivity!=null){
						schReportVirtualActivity.handleDay(report,day);
					}else{
						schReportVirtualActivity=new ScheduleReport();
						schReportVirtualActivity.handleDay(report,day);
						virtualActivitiesReports.put(virtualActivityCode, schReportVirtualActivity);
					}
					
				}
			}
		}
		
		report.setTamheel(tamheel);
		report.setArtsi(schReportArtsi);
		report.setForecast();
		
		return report;
	}


	/**
	 * get activities that should enter to the report
	 * @return
	 */
	private static Set<String> getRelevantActivities() {
		Set<String> list=null;
		DBAccess db= null;
		try{
			db=new DBAccess("wfm");
			db.prepareStatement("select * from wfm.wm_sch_report_activities");
			db.executeQuery();			
			list=new HashSet<String>();
			while(db.next()){
				list.add(db.getString(1));
			}
		}catch (DBQueryNoRowsException e) {
			
		}catch (Exception e) {
			logger.error(e);
		}finally{
			if(db!=null){
				try {
					db.close();
				} catch (DBException e) {
					logger.error(e);
				}
			}
		}
		return list;
	}


	public static ArrayList<TableForm> getAvailableSites(String scheduleId) {
		ArrayList<TableForm> array=new ArrayList<TableForm>();
		DBAccess db= null;
		try{
			db=new DBAccess("wfm");
			db.prepareStatement("select s.wm_site_id as CODE , s.wm_name as DESCRIPTION from wm_sch_sites t left join wm_sites s on s.wm_site_id=t.wm_site_id where t.wm_schedule_id=?");
			db.setString(1, scheduleId);
			db.executeQuery();
			TableForm site=null;
			while(db.next()){
				site=new TableForm();
				db.populate(site);
				array.add(site);
			}
		}catch (DBQueryNoRowsException e) {
			
		}catch (Exception e) {
			logger.error(e);
		}finally{
			if(db!=null){
				try {
					db.close();
				} catch (DBException e) {
					logger.error(e);
				}
			}
		}
		return array;
	}
	
	
	
	
	
	
}
