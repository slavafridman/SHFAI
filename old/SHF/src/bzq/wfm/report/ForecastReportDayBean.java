package bzq.wfm.report;

import bzq.shf.bean.ForecastDataBean;

public class ForecastReportDayBean extends ForecastDataBean {

	/**
	 * 
	 */
	private static final long serialVersionUID = -340022300767702770L;
	
	static {
		fieldsMapping.put("WM_SITE_ID", "siteId");
		fieldsMapping.put("WM_ACTIVITY_ID", "activityId");
	}
	protected String siteId;
	protected String activityId;
	
	public String getSiteId() {
		return siteId;
	}
	public void setSiteId(String siteId) {
		this.siteId = siteId;
	}
	public String getActivityId() {
		return activityId;
	}
	public void setActivityId(String activityId) {
		this.activityId = activityId;
	}
	
	public String toString(){
		return date + " "+ calculatedStaffing + " " + requiredStaffing + " " + activityId + " " + siteId;
	}
	
	
}
