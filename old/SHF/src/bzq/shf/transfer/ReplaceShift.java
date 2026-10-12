/*
 * Created on 16/02/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.transfer;

import java.util.Date;
import java.util.HashMap;

import bzq.shf.bean.ShfBaseBean;

/**
 * @author 03445956
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ReplaceShift extends ShfBaseBean {

	private int shiftId;
	private Date creationDate;
	private String errReason;
	private String day_change_inx;
	
	protected static HashMap fieldsMapping = null;
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("SHF_EMPLOYEE_DAY_ID", "shiftId");
		fieldsMapping.put("CREATION_DATE", "creationDate");
		fieldsMapping.put("ERR_REASON", "errReason");
		fieldsMapping.put("DAY_CHANGE_INX", "day_change_inx");
	}

	 
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}

	/**
	 * @return
	 */
	public Date getCreationDate() {
		return creationDate;
	}

	/**
	 * @return
	 */
	public String getDay_change_inx() {
		return day_change_inx;
	}

	/**
	 * @return
	 */
	public String getErrReason() {
		return errReason;
	}

	/**
	 * @return
	 */
	public int getShiftId() {
		return shiftId;
	}

	/**
	 * @param date
	 */
	public void setCreationDate(Date date) {
		creationDate = date;
	}

	/**
	 * @param string
	 */
	public void setDay_change_inx(String string) {
		day_change_inx = string;
	}

	/**
	 * @param string
	 */
	public void setErrReason(String string) {
		errReason = string;
	}

	/**
	 * @param string
	 */
	public void setShiftId(int value) {
		shiftId = value;
	}

}
