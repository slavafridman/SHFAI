/*
 * Created on 13/07/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.bean;

import java.util.Date;
import java.util.HashMap;

import bzq.shf.bean.ShfBaseBean;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ReduceRequestBean extends ShfBaseBean{
	protected static HashMap fieldsMapping = null;
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("SHIFT_REDUCE_ID","reduceId");
		fieldsMapping.put("SHIFT_END","shiftEnd"); 
		fieldsMapping.put("SHIFT_START","shiftStart"); 
		fieldsMapping.put("ACTIVITY_TYPE_ID","activity"); 
		fieldsMapping.put("AUTOMATIC_APPROVE","automaticApprove"); 
		fieldsMapping.put("CREATION_TIME","creationTime"); 
		fieldsMapping.put("EXCEPTION_SELECTION","selectedExceptions");
		fieldsMapping.put("MODIFICATION_TIME","modifyTime");
		fieldsMapping.put("MODIFICATION_USER", "modifyUser"); 
		fieldsMapping.put("MOKED_ID", "mokedId");
		fieldsMapping.put("NUMBER_OF_AGENTS", "numberOfAgets");
		
	}
	public HashMap getFieldsMapping() {
				return fieldsMapping;
			} 
	
	protected long reduceId;
	protected Date shiftEnd;
	protected Date shiftStart;
	protected String activity;
	protected String automaticApprove;
	protected Date creationTime;
	protected String selectedExceptions;
	protected Date modifyTime;
	protected String modifyUser;
	protected String mokedId;
	protected int numberOfAgets;

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
	public String getMokedId() {
		return mokedId;
	}

	/**
	 * @return
	 */
	public int getNumberOfAgets() {
		return numberOfAgets;
	}

	/**
	 * @return
	 */
	public long getReduceId() {
		return reduceId;
	}

	/**
	 * @return
	 */
	public String getSelectedExceptions() {
		return selectedExceptions;
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
	 * @param string
	 */
	public void setMokedId(String string) {
		mokedId = string;
	}

	/**
	 * @param i
	 */
	public void setNumberOfAgets(int i) {
		numberOfAgets = i;
	}

	/**
	 * @param l
	 */
	public void setReduceId(long l) {
		reduceId = l;
	}

	/**
	 * @param string
	 */
	public void setSelectedExceptions(String string) {
		selectedExceptions = string;
	}


	/**
	 * @return
	 */
	public String getActivity() {
		return activity;
	}

	/**
	 * @param string
	 */
	public void setActivity(String string) {
		activity = string;
	}


	/**
	 * @return
	 */
	public Date getShiftEnd() {
		return shiftEnd;
	}

	/**
	 * @return
	 */
	public Date getShiftStart() {
		return shiftStart;
	}

	/**
	 * @param date
	 */
	public void setShiftEnd(Date date) {
		shiftEnd = date;
	}

	/**
	 * @param date
	 */
	public void setShiftStart(Date date) {
		shiftStart = date;
	}

	/**
	 * @return
	 */
	public String getAutomaticApprove() {
		return automaticApprove;
	}

	/**
	 * @param string
	 */
	public void setAutomaticApprove(String string) {
		automaticApprove = string;
	}

}
