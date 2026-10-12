/*
 * Created on 02/12/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.batch.beans;

import java.util.Date;
import java.util.HashMap;

import bzq.shf.bean.AgentDayBean;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class CtiShiftBean extends AgentDayBean{

	//protected static HashMap fieldsMapping = null;
	static {		
		//fieldsMapping = new HashMap();
		
		fieldsMapping.put("CTI_SHIFT_ID","cti_shift_id");
		fieldsMapping.put("CTI_SHIFT_END","cti_shift_end");
		fieldsMapping.put("CTI_SHIFT_END_REWARD","cti_shift_end_reward");
		fieldsMapping.put("CTI_SHIFT_START","cti_shift_start");
		fieldsMapping.put("CTI_SHIFT_START_REWARD","cti_shift_start_reward");
		fieldsMapping.put("EMP_ID","emp_id");
		fieldsMapping.put("SAP_REQ_ID","sap_req_id");
		fieldsMapping.put("SAP_STATUS","sap_status");
		fieldsMapping.put("UPDATE_DATE","update_date");	
		fieldsMapping.put("HANDLE_STATUS","handle_status");
		fieldsMapping.put("SHF_EMPLOYEE_DAY_ID","shf_employee_day_id");
				
	}
	
	public long cti_shift_id;
	public Date cti_shift_end;
	public Date cti_shift_end_reward;
	public Date cti_shift_start;
	public Date cti_shift_start_reward;
	public String emp_id;
	public int sap_req_id;
	public int sap_status;
	public Date update_date;
	public int handle_status;
	public long shf_employee_day_id;
	
	
//	public HashMap getFieldsMapping() {
//		return fieldsMapping;
//	}
	

	/**
	 * @return
	 */
	public Date getCti_shift_end() {
		return cti_shift_end;
	}

	/**
	 * @return
	 */
	public Date getCti_shift_end_reward() {
		return cti_shift_end_reward;
	}

	/**
	 * @return
	 */
	public long getCti_shift_id() {
		return cti_shift_id;
	}

	/**
	 * @return
	 */
	public Date getCti_shift_start() {
		return cti_shift_start;
	}

	/**
	 * @return
	 */
	public Date getCti_shift_start_reward() {
		return cti_shift_start_reward;
	}

	/**
	 * @return
	 */
	public int getHandle_status() {
		return handle_status;
	}

	/**
	 * @return
	 */
	public int getSap_req_id() {
		return sap_req_id;
	}

	/**
	 * @return
	 */
	public int getSap_status() {
		return sap_status;
	}

	/**
	 * @return
	 */
	public Date getUpdate_date() {
		return update_date;
	}

	/**
	 * @param map
	 */
	public static void setFieldsMapping(HashMap map) {
		fieldsMapping = map;
	}

	/**
	 * @param date
	 */
	public void setCti_shift_end(Date date) {
		cti_shift_end = date;
	}

	/**
	 * @param date
	 */
	public void setCti_shift_end_reward(Date date) {
		cti_shift_end_reward = date;
	}

	/**
	 * @param l
	 */
	public void setCti_shift_id(long l) {
		cti_shift_id = l;
	}

	/**
	 * @param date
	 */
	public void setCti_shift_start(Date date) {
		cti_shift_start = date;
	}

	/**
	 * @param date
	 */
	public void setCti_shift_start_reward(Date date) {
		cti_shift_start_reward = date;
	}

	/**
	 * @param i
	 */
	public void setHandle_status(int i) {
		handle_status = i;
	}

	/**
	 * @param i
	 */
	public void setSap_req_id(int i) {
		sap_req_id = i;
	}

	/**
	 * @param i
	 */
	public void setSap_status(int i) {
		sap_status = i;
	}

	/**
	 * @param date
	 */
	public void setUpdate_date(Date date) {
		update_date = date;
	}

	/**
	 * @return
	 */
	public String getEmp_id() {
		return emp_id;
	}

	/**
	 * @param string
	 */
	public void setEmp_id(String string) {
		emp_id = string;
	}

	/**
	 * @return
	 */
	public long getShf_employee_day_id() {
		return shf_employee_day_id;
	}

	/**
	 * @param l
	 */
	public void setShf_employee_day_id(long l) {
		shf_employee_day_id = l;
	}
	
	public Date get_cti_start() {
		return cti_shift_start_reward==null?cti_shift_start:cti_shift_start_reward;
	}
	
	public Date get_cti_end() {
		return cti_shift_end_reward==null?cti_shift_end:cti_shift_end_reward;
	}

}
