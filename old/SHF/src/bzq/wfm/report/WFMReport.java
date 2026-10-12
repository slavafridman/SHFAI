package bzq.wfm.report;

import java.util.ArrayList;
import java.util.Date;
import java.util.Hashtable;
import java.util.StringTokenizer;

import bzq.forms.TableForm;
import bzq.utils.BaseConvert;

public class WFMReport {
	
	ScheduleReport artsi;
	
	Hashtable<String,ScheduleReport> sitesReports;
	Hashtable<String,ScheduleReport> activitiesReports;
	Hashtable<String,ScheduleReport> virtualActivitiesReports;
	
	Hashtable<String,TamheelReport> tamheel;
	ArrayList<ForecastReportDayBean> forecastData;
	TableForm site;
	Date scheduleStart;
	Date scheduleEnd;
	String scheduleId;
	String scheduleName;
	String forecastName;
		
	public ScheduleReport getArtsi() {
		return artsi;
	}
	
	public void setArtsi(ScheduleReport artsi) {
		this.artsi = artsi;
	}
		
	public Hashtable<String, ScheduleReport> getSitesReports() {
		return sitesReports;
	}

	public void setSitesReports(Hashtable<String, ScheduleReport> sitesReports) {
		this.sitesReports = sitesReports;
	}

	public Hashtable<String, ScheduleReport> getActivitiesReports() {
		return activitiesReports;
	}

	public void setActivitiesReports(
			Hashtable<String, ScheduleReport> activitiesReports) {
		this.activitiesReports = activitiesReports;
	}
	
	public ArrayList<ForecastReportDayBean> getForecastData() {
		return forecastData;
	}

	public void setForecastData(ArrayList<ForecastReportDayBean> forecastData) {
		this.forecastData = forecastData;
	}

	public Hashtable<String, TamheelReport> getTamheel() {
		return tamheel;
	}
	
	public void setTamheel(Hashtable<String, TamheelReport> tamheel) {
		this.tamheel = tamheel;
	}

	public Hashtable<String, ScheduleReport> getVirtualActivitiesReports() {
		return virtualActivitiesReports;
	}

	public void setVirtualActivitiesReports(
			Hashtable<String, ScheduleReport> virtualActivitiesReports) {
		this.virtualActivitiesReports = virtualActivitiesReports;
	}

	
	

	public Date getScheduleStart() {
		return scheduleStart;
	}

	public void setScheduleStart(Date scheduleStart) {
		this.scheduleStart = scheduleStart;
	}

	public Date getScheduleEnd() {
		return scheduleEnd;
	}

	public void setScheduleEnd(Date scheduleEnd) {
		this.scheduleEnd = scheduleEnd;
	}

	public String getScheduleId() {
		return scheduleId;
	}

	public void setScheduleId(String scheduleId) {
		this.scheduleId = scheduleId;
	}

	public String getScheduleName() {
		return scheduleName;
	}

	public void setScheduleName(String scheduleName) {
		this.scheduleName = scheduleName;
	}

	public TableForm getSite() {
		return site;
	}

	public void setSite(TableForm site) {
		this.site = site;
	}
	

	public String getForecastName() {
		return forecastName;
	}

	public void setForecastName(String forecastName) {
		this.forecastName = forecastName;
	}

	public void setForecast() {
		StringTokenizer st=null;
		short[] arrayRequired;
		short[] arrayCalculated;
		for(ForecastReportDayBean forecastDayBean:forecastData){
			String required=forecastDayBean.getRequiredStaffing();
			String calculated=forecastDayBean.getCalculatedStaffing();
			if(required==null) continue;
			arrayRequired=new short[96];
			arrayCalculated=new short[96];
			st=new StringTokenizer(required,";");
			int i=0;
			while(st.hasMoreTokens()){
				String tmp=st.nextToken();
				if(!"*".equals(tmp)){
					try{
						arrayRequired[i]=(short)BaseConvert.stringToFloat(tmp).floatValue();
					}catch (Exception e) {e.printStackTrace();}
				}
				i++;
			}
			
			if(calculated!=null){
				st=new StringTokenizer(calculated,";");
				i=0;
				while(st.hasMoreTokens()){
					String tmp=st.nextToken();
					if(!"*".equals(tmp)){
						try{
							arrayCalculated[i]=(short)BaseConvert.stringToFloat(tmp).floatValue();
						}catch (Exception e) {e.printStackTrace();}
					}
					i++;
				}
			}
			
			String activity=forecastDayBean.getActivityId();
			String site=forecastDayBean.getSiteId();
			
			artsi.addForecastData(arrayRequired, arrayCalculated, forecastDayBean.getDate(),null);
			
			if(activity!=null && virtualActivitiesReports!=null){
				ScheduleReport activityScheduleReport=virtualActivitiesReports.get(activity);
				if(activityScheduleReport!=null){
					activityScheduleReport.addForecastData(arrayRequired,arrayCalculated, forecastDayBean.getDate(),null);
				}
			}
			
			if(site!=null){
				ScheduleReport siteScheduleReport=sitesReports.get(site);
				if(siteScheduleReport!=null){
					siteScheduleReport.addForecastData(arrayRequired,arrayCalculated, forecastDayBean.getDate(),activity);
				}
			}
		}
	}

	
	

}
