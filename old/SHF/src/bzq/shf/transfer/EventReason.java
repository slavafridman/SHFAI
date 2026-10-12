/*
 * Created on Dec 30, 2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.transfer;

import java.util.HashMap;

/**
 * @author 03445956
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class EventReason extends BaseAdminForm {

	/* (non-Javadoc)
	 * @see bzq.forms.BaseForm#getFieldsMapping()
	 */
	protected static HashMap fieldsMapping = null;
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("REASON_ID", "reasonId");
		fieldsMapping.put("REASON_DESC", "reasonName");
		fieldsMapping.put("BRANCH_ID", "branch");
		fieldsMapping.put("REPORTED", "reported");
		fieldsMapping.put("REPORT_REQUESTED","reportRequested");
		fieldsMapping.put("SER_TYPE","type");
	}

	private int reasonId;
	private String reasonName;
	private String branch;
	private int reported;
	private int reportRequested;
	private int type;

	/* (non-Javadoc)
	 * @see bzq.shf.bean.ShfBaseBean#getFieldsMapping()
	 */

	public HashMap getFieldsMapping() {	
		return fieldsMapping;
	}


	

	/**
	 * @return
	 */

	public String getBranch() {
		return branch;
	}

	/**
	 * @return
	 */

	public int getReasonId() {
		return reasonId;
	}


	/**
	 * @return
	 */

	public String getReasonName() {
		return reasonName;
	}



	/**

	 * @return

	 */

	public int getReported() {

		return reported;

	}



	/**

	 * @return

	 */

	public int getReportRequested() {

		return reportRequested;

	}



	/**

	 * @return

	 */

	public int getType() {

		return type;

	}



	/**

	 * @param map

	 */

	public static void setFieldsMapping(HashMap map) {

		fieldsMapping = map;

	}



	/**

	 * @param i

	 */

	public void setBranch(String str) {

		branch = str;

	}



	/**

	 * @param i

	 */

	public void setReasonId(int i) {

		reasonId = i;

	}



	/**

	 * @param string

	 */

	public void setReasonName(String string) {

		reasonName = string;

	}



	/**

	 * @param i

	 */

	public void setReported(int i) {

		reported = i;

	}



	/**

	 * @param i

	 */

	public void setReportRequested(int i) {

		reportRequested = i;

	}



	/**

	 * @param i

	 */

	public void setType(int i) {

		type = i;

	}


}
