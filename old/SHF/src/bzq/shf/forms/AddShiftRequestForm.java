/*
 * Created on 16/02/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import java.util.Date;
import java.util.HashMap;

import bzq.shf.bean.ShfBaseBean;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class AddShiftRequestForm extends ShfBaseBean{

	private Date date;
	private String from;
	private String to;
	private String activity;
	private String moked;
	private int inforceRequestId;
	private String empIdNumber;
//Yuval	
	private String sourceWindow = null;
	
	public AddShiftRequestForm(){
		
	}
	
	public HashMap getFieldsMapping() {
		return null;
	}

	
	/**
	 * @return
	 */
	public String getActivity() {
		return activity;
	}

	/**
	 * @return
	 */
	public Date getDate() {
		return date;
	}

	/**
	 * @return
	 */
	public String getFrom() {
		return from;
	}

	/**
	 * @return
	 */
	public int getInforceRequestId() {
		return inforceRequestId;
	}

	/**
	 * @return
	 */
	public String getTo() {
		return to;
	}

	/**
	 * @param string
	 */
	public void setActivity(String string) {
		activity = string;
	}

	/**
	 * @param d
	 */
	public void setDate(Date d) {
		date = d;
	}

	/**
	 * @param string
	 */
	public void setFrom(String string) {
		from = string;
	}

	/**
	 * @param i
	 */
	public void setInforceRequestId(int i) {
		inforceRequestId = i;
	}

	/**
	 * @param string
	 */
	public void setTo(String string) {
		to = string;
	}

	/**
	 * @return
	 */
	public String getMoked() {
		return moked;
	}

	/**
	 * @param string
	 */
	public void setMoked(String string) {
		moked = string;
	}

	/**
	 * @return
	 */
	public String getEmpIdNumber() {
		return empIdNumber;
	}

	/**
	 * @param string
	 */
	public void setEmpIdNumber(String string) {
		empIdNumber = string;
	}

/**
 * @return
 */
public String getSourceWindow() {
	return sourceWindow;
}

/**
 * @param string
 */
public void setSourceWindow(String string) {
	sourceWindow = string;
}

}
