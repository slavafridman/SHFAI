package bzq.shf.bean;

import java.util.Date;
import java.util.HashMap;

public class ActivityAimBean extends ShfBaseBean{
	
	protected static HashMap fieldsMapping = null;
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("ACTIVITY_TYPE_ID", "virtualActivity");
		fieldsMapping.put("ACTIVITY_AIM", "activityAim");
		fieldsMapping.put("ACTIVITY_DAY", "activityDay");
		fieldsMapping.put("MODIFICATION_TIME", "modificationTime");
		fieldsMapping.put("MODIFICATION_USER", "modificationUser");
		
	}
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}
	public ActivityAimBean(){
		super();
	}
	
	protected Date modificationTime;
	protected String modificationUser;
	protected String activityAim;
	protected Integer activityDay;
	
	protected String virtualActivity;
//-------------- Igal 5.2013---------
	protected String moked;
	protected String activity;
	protected String rbChoice; // Radio button status (choice)
//-----------------------------------
	
	public String getRbChoice() {
		return rbChoice;
	}
	public void setRbChoice(String rbChoice) {
		this.rbChoice = rbChoice;
	}
	
	public String getMoked() {
		return moked;
	}
	
	public void setMoked(String moked) {
		this.moked = moked;
	}
	public String getActivity() {
		return activity;
	}
	public void setActivity(String activity) {
		this.activity = activity;
	}

	protected String[][] activityAimArray=null;
	
	
	public Date getModificationTime() {
		return modificationTime;
	}
	public void setModificationTime(Date modificationTime) {
		this.modificationTime = modificationTime;
	}
	public String getModificationUser() {
		return modificationUser;
	}
	public void setModificationUser(String modificationUser) {
		this.modificationUser = modificationUser;
	}
		
	
	public String getActivityAim() {
		return activityAim;
	}
	public void setActivityAim(String activityAim) {
		this.activityAim = activityAim;
	}
	public static void setFieldsMapping(HashMap fieldsMapping) {
		ActivityAimBean.fieldsMapping = fieldsMapping;
	}
	public String getVirtualActivity() {
		return virtualActivity;
	}
	public void setVirtualActivity(String virtualActivity) {
		this.virtualActivity = virtualActivity;
	}
	public String[][] getActivityAimArray() {
		return activityAimArray;
	}
	public void setActivityAimArray(String[][] activityAimArray) {
		this.activityAimArray = activityAimArray;
	}
	public Integer getActivityDay() {
		return activityDay;
	}
	public void setActivityDay(Integer activityDay) {
		this.activityDay = activityDay;
	}
	
	
    
	
	
}
