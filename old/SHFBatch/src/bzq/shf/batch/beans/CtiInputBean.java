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
public class CtiInputBean extends ShfBaseBean{

	protected static HashMap fieldsMapping = null;
	static {
		
		fieldsMapping = new HashMap();
		fieldsMapping.put("AGENTDBID","agentdbid");
		fieldsMapping.put("CURRENT_TIME","current_time");
		fieldsMapping.put("STATUS","status");
		fieldsMapping.put("EMP_ID","emp_id");
		fieldsMapping.put("CREATION_DATE","creation_date");	
		fieldsMapping.put("HANDLE_STATUS","handle_status");
		fieldsMapping.put("SOURCE","source");
		fieldsMapping.put("CTI_PART_ID","cti_part_id");
		fieldsMapping.put("STATUS_WEIGHT", "status_weight");
		
				
	}
	
	public long agentdbid;
	public Date current_time;
	public int status;
	public String emp_id;
	public Date creation_date;
	public int handle_status;
	public String source;
	public long cti_part_id;
	public int status_weight;
	
	
	public int getStatus_weight() {
		return status_weight;
	}

	public void setStatus_weight(int status_weight) {
		this.status_weight = status_weight;
	}

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
	public long getAgentdbid() {
		return agentdbid;
	}

	/**
	 * @return
	 */
	public Date getCreation_date() {
		return creation_date;
	}

	/**
	 * @return
	 */
	public Date getCurrent_time() {
		return current_time;
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
	public int getHandle_status() {
		return handle_status;
	}

	/**
	 * @return
	 */
	public String getSource() {
		return source;
	}

	/**
	 * @return
	 */
	public int getStatus() {
		return status;
	}

	/**
	 * @param l
	 */
	public void setAgentdbid(long l) {
		agentdbid = l;
	}

	/**
	 * @param date
	 */
	public void setCreation_date(Date date) {
		creation_date = date;
	}

	/**
	 * @param date
	 */
	public void setCurrent_time(Date date) {
		current_time = date;
	}

	/**
	 * @param string
	 */
	public void setEmp_id(String string) {
		emp_id = string;
	}

	/**
	 * @param i
	 */
	public void setHandle_status(int i) {
		handle_status = i;
	}

	/**
	 * @param string
	 */
	public void setSource(String string) {
		source = string;
	}

	/**
	 * @param i
	 */
	public void setStatus(int i) {
		status = i;
	}

}
