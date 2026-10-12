/*
 * Created on 19/01/2010
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
public class CtiCompletionBean extends ShfBaseBean{
	
	protected static HashMap fieldsMapping = null;
	static {
		
		fieldsMapping = new HashMap();
		
		fieldsMapping.put("EMP_ID","empId");
		fieldsMapping.put("SAP_STATUS","sapStatus");
		fieldsMapping.put("UPDATE_DATE","updateDate");
		fieldsMapping.put("COPMLETION_START","copmletionStart");
		fieldsMapping.put("COPMLETION_END","copmletionEnd");
		fieldsMapping.put("COPMLETION_END_CALC","copmletionEndCalc");
		fieldsMapping.put("COPMLETION_START_CALC","copmletionStartCalc");
		fieldsMapping.put("UPDATE_ID","updateId");
		fieldsMapping.put("COPMLETION_SEQ_CODE","copmletionSeqCode");
		fieldsMapping.put("COMPLETION_CODE","completionCode");
		fieldsMapping.put("SAP_REQ_ID","sapReqId");
				
	}
	
	public String empId;
	public long sapStatus;
	public Date updateDate;
	public Date copmletionStart;
	public Date copmletionEnd;
	public Date copmletionEndCalc;
	public Date copmletionStartCalc;
	public String updateId;
	public long copmletionSeqCode;
	public long completionCode;
	public long sapReqId;
	
	
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}
	/**
	 * @return
	 */
	public long getCompletionCode() {
		return completionCode;
	}

	/**
	 * @return
	 */
	public Date getCopmletionEnd() {
		return copmletionEnd;
	}

	/**
	 * @return
	 */
	public Date getCopmletionEndCalc() {
		return copmletionEndCalc;
	}

	/**
	 * @return
	 */
	public long getCopmletionSeqCode() {
		return copmletionSeqCode;
	}

	/**
	 * @return
	 */
	public Date getCopmletionStart() {
		return copmletionStart;
	}

	/**
	 * @return
	 */
	public Date getCopmletionStartCalc() {
		return copmletionStartCalc;
	}

	/**
	 * @return
	 */
	public String getEmpId() {
		return empId;
	}

	/**
	 * @return
	 */
	public long getSapReqId() {
		return sapReqId;
	}

	/**
	 * @return
	 */
	public long getSapStatus() {
		return sapStatus;
	}

	/**
	 * @return
	 */
	public Date getUpdateDate() {
		return updateDate;
	}

	/**
	 * @return
	 */
	public String getUpdateId() {
		return updateId;
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
	public void setCompletionCode(long l) {
		completionCode = l;
	}

	/**
	 * @param date
	 */
	public void setCopmletionEnd(Date date) {
		copmletionEnd = date;
	}

	/**
	 * @param date
	 */
	public void setCopmletionEndCalc(Date date) {
		copmletionEndCalc = date;
	}

	/**
	 * @param l
	 */
	public void setCopmletionSeqCode(long l) {
		copmletionSeqCode = l;
	}

	/**
	 * @param date
	 */
	public void setCopmletionStart(Date date) {
		copmletionStart = date;
	}

	/**
	 * @param date
	 */
	public void setCopmletionStartCalc(Date date) {
		copmletionStartCalc = date;
	}

	/**
	 * @param string
	 */
	public void setEmpId(String string) {
		empId = string;
	}

	/**
	 * @param l
	 */
	public void setSapReqId(long l) {
		sapReqId = l;
	}

	/**
	 * @param l
	 */
	public void setSapStatus(long l) {
		sapStatus = l;
	}

	/**
	 * @param date
	 */
	public void setUpdateDate(Date date) {
		updateDate = date;
	}

	/**
	 * @param string
	 */
	public void setUpdateId(String string) {
		updateId = string;
	}

}
