package bzq.shf.bean;

import java.util.Date;

public class UsageReportBean extends EmployeeBean {
	
	static {
		fieldsMapping.put("ACTION_ID", "actionId");
		fieldsMapping.put("ACTION_NAME", "actionName");
		fieldsMapping.put("ACTION_DATE", "actionDate");
	}

	protected Integer actionId;
	protected String actionName;
	protected Date actionDate;

	public Integer getActionId() {
		return actionId;
	}
	public void setActionId(Integer actionId) {
		this.actionId = actionId;
	}
	public String getActionName() {
		return actionName;
	}
	public void setActionName(String actionName) {
		this.actionName = actionName;
	}
	public Date getActionDate() {
		return actionDate;
	}
	public void setActionDate(Date actionDate) {
		this.actionDate = actionDate;
	}

}
