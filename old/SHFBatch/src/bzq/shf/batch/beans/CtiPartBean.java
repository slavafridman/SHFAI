/*
 * Created on 02/12/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.batch.beans;

import java.util.Date;
import java.util.HashMap;

import bzq.shf.bean.ShfBaseBean;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class CtiPartBean extends ShfBaseBean{
	
	protected static HashMap fieldsMapping = null;
	static {
		
		fieldsMapping = new HashMap();
		fieldsMapping.put("CTI_PART_START","cti_part_start");
		fieldsMapping.put("EMP_ID","emp_id");
		fieldsMapping.put("CTI_PART_END","cti_part_end");
		fieldsMapping.put("CTI_PART_END_UPDATE","cti_part_end_update");
		fieldsMapping.put("PROCESS_DATE","process_date");	
		fieldsMapping.put("UPDATE_DATE","update_date");
		fieldsMapping.put("UPDATE_ID","update_id");
		fieldsMapping.put("UPDATE_ID","update_id");
		fieldsMapping.put("HANDLE_STATUS","handle_status");
		fieldsMapping.put("CTI_START_END_KEY","cti_start_end_key");
		fieldsMapping.put("CTI_PART_ID","cti_part_id");
				
	}
	
	public Date cti_part_start;
	public String emp_id;
	public Date cti_part_end;
	public Date cti_part_end_update;
	public Date process_date;
	public Date update_date;
	public String update_id;
	public int handle_status;
	public long cti_start_end_key;
	public long cti_part_id;
	
	public long getCti_part_id() {
		return cti_part_id;
	}

	public void setCti_part_id(long cti_part_id) {
		this.cti_part_id = cti_part_id;
	}

	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}

	/**
	 * @return
	 */
	public Date getCti_part_end() {
		return cti_part_end;
	}

	/**
	 * @return
	 */
	public Date getCti_part_end_update() {
		return cti_part_end_update;
	}

	/**
	 * @return
	 */
	public Date getCti_part_start() {
		return cti_part_start;
	}

	/**
	 * @return
	 */
	public String getEmp_id() {
		return emp_id;
	}

	/**
	 * @return
	 */
	public Date getProcess_date() {
		return process_date;
	}

	/**
	 * @return
	 */
	public Date getUpdate_date() {
		return update_date;
	}

	/**
	 * @return
	 */
	public String getUpdate_id() {
		return update_id;
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
	public void setCti_part_end(Date date) {
		cti_part_end = date;
	}

	/**
	 * @param date
	 */
	public void setCti_part_end_update(Date date) {
		cti_part_end_update = date;
	}

	/**
	 * @param date
	 */
	public void setCti_part_start(Date date) {
		cti_part_start = date;
	}

	/**
	 * @param string
	 */
	public void setEmp_id(String string) {
		emp_id = string;
	}

	/**
	 * @param date
	 */
	public void setProcess_date(Date date) {
		process_date = date;
	}

	/**
	 * @param date
	 */
	public void setUpdate_date(Date date) {
		update_date = date;
	}

	/**
	 * @param string
	 */
	public void setUpdate_id(String string) {
		update_id = string;
	}

	/**
	 * @return
	 */
	public long getCti_start_end_key() {
		return cti_start_end_key;
	}

	/**
	 * @return
	 */
	public int getHandle_status() {
		return handle_status;
	}

	/**
	 * @param l
	 */
	public void setCti_start_end_key(long l) {
		cti_start_end_key = l;
	}

	/**
	 * @param i
	 */
	public void setHandle_status(int i) {
		handle_status = i;
	}

}
