package bzq.shf.bean;

import java.util.Date;
import java.util.HashMap;

public class OptShSpFlagBean extends ShfBaseBean {
	
	protected static HashMap<String, String> fieldsMapping = null;
	static {
		fieldsMapping = new HashMap<String, String>();
		fieldsMapping.put("ORG_UNIT_CODE" , "orgUnitCode");
		fieldsMapping.put("FLAG_ENABLED" , "flagEnabled");
		fieldsMapping.put("UPDATE_TIME" , "updateTime");
		fieldsMapping.put("UPDATE_USER_ID" , "updateUserId");
		fieldsMapping.put("UPDATE_USER" , "updateUser");
		fieldsMapping.put("UPDATE_REASON" , "updateReason");
	}
	
	protected String orgUnitCode;
	protected boolean flagEnabled;
	protected Date updateTime;
	protected String updateUserId;
	protected String updateUser;
	protected String updateReason;

	public String getOrgUnitCode() {
		return orgUnitCode;
	}

	public void setOrgUnitCode(String orgUnitCode) {
		this.orgUnitCode = orgUnitCode;
	}

	public boolean isFlagEnabled() {
		return flagEnabled;
	}

	public void setFlagEnabled(boolean flagEnabled) {
		this.flagEnabled = flagEnabled;
	}

	public Date getUpdateTime() {
		return updateTime;
	}

	public void setUpdateTime(Date updateTime) {
		this.updateTime = updateTime;
	}

	public String getUpdateUserId() {
		return updateUserId;
	}

	public void setUpdateUserId(String updateUserId) {
		this.updateUserId = updateUserId;
	}

	public String getUpdateUser() {
		return updateUser;
	}

	public void setUpdateUser(String updateUser) {
		this.updateUser = updateUser;
	}

	public String getUpdateReason() {
		return updateReason;
	}

	public void setUpdateReason(String updateReason) {
		this.updateReason = updateReason;
	}

	public static void setFieldsMapping(HashMap<String, String> fieldsMapping) {
		OptShSpFlagBean.fieldsMapping = fieldsMapping;
	}

	@Override
	public HashMap<String, String> getFieldsMapping() {
		return fieldsMapping;
	}

}
