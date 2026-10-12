package bzq.wfm.report;

import java.util.Date;
import java.util.HashMap;

import bzq.shf.bean.ShfBaseBean;

public class WfmReportForm extends ShfBaseBean{

	private static final long serialVersionUID = 8296069467410268277L;

	protected String businessUnit;
	protected String scheduleId;
	protected String forecastId;
	protected Date from;
	protected Date to;
	protected String path;
	protected String siteId;
	protected boolean scenario;
	///////////////////////////
	protected String agaf;
	protected String moked;
	protected String[] team;
	protected String[] innerJob;
	protected String job;
	protected int status;
	protected String[] activityList;
	protected String[] skillList;
	
	
	public String getBusinessUnit() {
		return businessUnit;
	}
	
	public void setBusinessUnit(String businessUnit) {
		this.businessUnit = businessUnit;
	}
	
	public String getScheduleId() {
		return scheduleId;
	}
	
	public void setScheduleId(String scheduleId) {
		this.scheduleId = scheduleId;
	}
	
	public Date getFrom() {
		return from;
	}
	
	public void setFrom(Date from) {
		this.from = from;
	}
	
	public Date getTo() {
		return to;
	}
	
	public void setTo(Date to) {
		this.to = to;
	}

	@Override
	public HashMap getFieldsMapping() {
		return null;
	}

	public String getPath() {
		return path;
	}

	public void setPath(String path) {
		this.path = path;
	}

	public String getForecastId() {
		return forecastId;
	}

	public void setForecastId(String forecastId) {
		this.forecastId = forecastId;
	}

	public String getSiteId() {
		return siteId;
	}

	public void setSiteId(String siteId) {
		this.siteId = siteId;
	}

	public String getAgaf() {
		return agaf;
	}

	public void setAgaf(String agaf) {
		this.agaf = agaf;
	}

	public String getMoked() {
		return moked;
	}

	public void setMoked(String moked) {
		this.moked = moked;
	}

	public String[] getTeam() {
		return team;
	}

	public void setTeam(String[] team) {
		this.team = team;
	}

	public String[] getInnerJob() {
		return innerJob;
	}

	public void setInnerJob(String[] innerJob) {
		this.innerJob = innerJob;
	}

	public String getJob() {
		return job;
	}

	public void setJob(String job) {
		this.job = job;
	}

	public int getStatus() {
		return status;
	}

	public void setStatus(int status) {
		this.status = status;
	}

	public String[] getActivityList() {
		return activityList;
	}

	public void setActivityList(String[] activityList) {
		this.activityList = activityList;
	}

	public String[] getSkillList() {
		return skillList;
	}

	public void setSkillList(String[] skillList) {
		this.skillList = skillList;
	}

	
	
}
