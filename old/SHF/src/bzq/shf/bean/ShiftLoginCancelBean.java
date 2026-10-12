/*
 * Created on 17/11/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.bean;

import java.util.Date;
import java.util.HashMap;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ShiftLoginCancelBean extends ShfBaseBean {
	
	protected static HashMap fieldsMapping = null;
	static {
		fieldsMapping = new HashMap();
		
		fieldsMapping.put("SHF_EMPLOYEE_DAY_ID", "agentDayId");
		fieldsMapping.put("CTI_SHIFT_ID","ctiShiftId");
		fieldsMapping.put("APPLIER_NAME","applierName");
		fieldsMapping.put("UPDATER_NAME","updaterName");
		fieldsMapping.put("CANCEL_LOGIN_REMARK","cancelLoginRemark");
		fieldsMapping.put("UPDATE_DATE","updateDate");		
	}
	
	/* (non-Javadoc)
	 * @see bzq.shf.bean.ShfBaseBean#getFieldsMapping()
	 */
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	} 
	protected long agentDayId;
	protected long ctiShiftId;
	protected String applierName;
	protected String updaterName;
	protected String cancelLoginRemark;
	protected Date updateDate;
		
	/**
	 * @param map
	 */
	public static void setFieldsMapping(HashMap map) {
		fieldsMapping = map;
	}

	public long getAgentDayId() {
		return agentDayId;
	}

	public void setAgentDayId(long agentDayId) {
		this.agentDayId = agentDayId;
	}

	public long getCtiShiftId() {
		return ctiShiftId;
	}

	public void setCtiShiftId(long ctiShiftId) {
		this.ctiShiftId = ctiShiftId;
	}

	public String getApplierName() {
		return applierName;
	}

	public void setApplierName(String applierName) {
		this.applierName = applierName;
	}

	public String getUpdaterName() {
		return updaterName;
	}

	public void setUpdaterName(String updaterName) {
		this.updaterName = updaterName;
	}

	public String getCancelLoginRemark() {
		return cancelLoginRemark;
	}

	public void setCancelLoginRemark(String cancelLoginRemark) {
		this.cancelLoginRemark = cancelLoginRemark;
	}

	public Date getUpdateDate() {
		return updateDate;
	}

	public void setUpdateDate(Date updateDate) {
		this.updateDate = updateDate;
	}

}
