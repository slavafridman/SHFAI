/*
 * Created on 13/07/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.bean;

import java.util.Date;
import java.util.HashMap;

import bzq.shf.bean.AgentDayBean;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ReduceShiftBean extends AgentDayBean{
	
	static{
		fieldsMapping.put("SHIFT_REDUCE_ID","reduceId"); 
		fieldsMapping.put("AGENT_ID", "agentId");
		fieldsMapping.put("APPROVE_TIME", "approveTime"); 
		fieldsMapping.put("CREATION_TIME", "creationTime");
		fieldsMapping.put("MODIFICATION_TIME", "modifyTime");
		fieldsMapping.put("MODIFICATION_USER", "modifyUser");
	}
	
	protected long reduceId;
	protected long agentId;
	protected Date approveTime;
	protected Date creationTime;
	protected Date modifyTime;
	protected String modifyUser;
	
	/**
	 * @return
	 */
	public long getAgentId() {
		return agentId;
	}

	/**
	 * @return
	 */
	public Date getApproveTime() {
		return approveTime;
	}

	/**
	 * @return
	 */
	public Date getCreationTime() {
		return creationTime;
	}

	/**
	 * @return
	 */
	public Date getModifyTime() {
		return modifyTime;
	}

	/**
	 * @return
	 */
	public String getModifyUser() {
		return modifyUser;
	}

	/**
	 * @return
	 */
	public long getReduceId() {
		return reduceId;
	}

	/**
	 * @param map
	 */
	public static void setFieldsMapping(HashMap map) {
		fieldsMapping = map;
	}

	/**
	 * @param l
	 */
	public void setAgentId(long l) {
		agentId = l;
	}

	/**
	 * @param date
	 */
	public void setApproveTime(Date date) {
		approveTime = date;
	}

	/**
	 * @param date
	 */
	public void setCreationTime(Date date) {
		creationTime = date;
	}

	/**
	 * @param date
	 */
	public void setModifyTime(Date date) {
		modifyTime = date;
	}

	/**
	 * @param string
	 */
	public void setModifyUser(String string) {
		modifyUser = string;
	}

	/**
	 * @param l
	 */
	public void setReduceId(long l) {
		reduceId = l;
	}

}
