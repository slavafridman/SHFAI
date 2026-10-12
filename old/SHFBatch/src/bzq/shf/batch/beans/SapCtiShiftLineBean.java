/*
 * Created on 17/01/2010
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.batch.beans;

import bzq.shf.batch.ShfBatchConstants;
import bzq.utils.BaseConvert;



/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class SapCtiShiftLineBean {
	
	private CtiShiftBean ctiBean;
	private String recType;
	
	public SapCtiShiftLineBean(CtiShiftBean ctiBean, String recType){
		this.ctiBean = ctiBean;
		this.recType = recType;
		
	}
	public String field1_8spaces = null;
	public String field2_user_id = null;
	public String field3_date_yyyymmdd = null;
	public String field4_time_hhmmss = null;
	public String field5_date_yyyymmdd = null;
	public String field6_time_hhmmss = null;
	public String field7_rec_type = null;
	public String field8_clock_number = null;
	public String field9_4spaces = null;

	public String toString(){
		String str; 
		if (recType.equals(ShfBatchConstants.Sap_Line_OUT)) {
					setField7_rec_type(ShfBatchConstants.Sap_Line_OUT);
					setField3_date_yyyymmdd(field5_date_yyyymmdd = BaseConvert.dateToString(ctiBean.get_cti_end(), "yyyyMMdd"));
					setField4_time_hhmmss(field6_time_hhmmss = BaseConvert.dateToString(ctiBean.get_cti_end(), "HHmmss"));
					//setField4_time_hhmmss(field6_time_hhmmss = BaseConvert.dateToString(ctiBean.get_cti_end(), "HHmm"));
					//Yuval 
					//make second = zero
					//29.01.12 - rollback
				}else if (recType.equals(ShfBatchConstants.Sap_Line_IN)) {
					setField7_rec_type(ShfBatchConstants.Sap_Line_IN);
					setField3_date_yyyymmdd(field5_date_yyyymmdd = BaseConvert.dateToString(ctiBean.get_cti_start(), "yyyyMMdd"));
					setField4_time_hhmmss(field6_time_hhmmss = BaseConvert.dateToString(ctiBean.get_cti_start(), "HHmmss"));
					//setField4_time_hhmmss(field6_time_hhmmss = BaseConvert.dateToString(ctiBean.get_cti_start(), "HHmm"));
					//Yuval 
					//make second = zero
					//29.01.12 - rollback
				}
				
		str = ShfBatchConstants.Sap_8spaces + ctiBean.getEmp_id();
		//Yuval 
		//make second = zero
		str = str + getField3_date_yyyymmdd() + getField4_time_hhmmss() + getField5_date_yyyymmdd() + getField6_time_hhmmss();
		str = str + getField7_rec_type() + ShfBatchConstants.Sap_ClockNumber + ShfBatchConstants.Sap_4spaces;
		
		return str;
	}
	/**
	 * @return
	 */
	public String getField1_8spaces() {
		return field1_8spaces;
	}

	/**
	 * @return
	 */
	public String getField2_user_id() {
		return field2_user_id;
	}

	/**
	 * @return
	 */
	public String getField3_date_yyyymmdd() {
		return field3_date_yyyymmdd;
	}

	/**
	 * @return
	 */
	public String getField4_time_hhmmss() {
		return field4_time_hhmmss;
	}

	/**
	 * @return
	 */
	public String getField5_date_yyyymmdd() {
		return field5_date_yyyymmdd;
	}

	/**
	 * @return
	 */
	public String getField6_time_hhmmss() {
		return field6_time_hhmmss;
	}

	/**
	 * @return
	 */
	public String getField7_rec_type() {
		return field7_rec_type;
	}

	/**
	 * @return
	 */
	public String getField8_clock_number() {
		return field8_clock_number;
	}

	/**
	 * @return
	 */
	public String getField9_4spaces() {
		return field9_4spaces;
	}

	/**
	 * @param string
	 */
	public void setField1_8spaces(String string) {
		field1_8spaces = string;
	}

	/**
	 * @param string
	 */
	public void setField2_user_id(String string) {
		field2_user_id = string;
	}

	/**
	 * @param string
	 */
	public void setField3_date_yyyymmdd(String string) {
		field3_date_yyyymmdd = string;
	}

	/**
	 * @param string
	 */
	public void setField4_time_hhmmss(String string) {
		field4_time_hhmmss = string;
	}

	/**
	 * @param string
	 */
	public void setField5_date_yyyymmdd(String string) {
		field5_date_yyyymmdd = string;
	}

	/**
	 * @param string
	 */
	public void setField6_time_hhmmss(String string) {
		field6_time_hhmmss = string;
	}

	/**
	 * @param string
	 */
	public void setField7_rec_type(String string) {
		field7_rec_type = string;
	}

	/**
	 * @param string
	 */
	public void setField8_clock_number(String string) {
		field8_clock_number = string;
	}

	/**
	 * @param string
	 */
	public void setField9_4spaces(String string) {
		field9_4spaces = string;
	}
	
	public String getLine() {
		String sapLine=null;
		
		sapLine = field1_8spaces + field2_user_id + field3_date_yyyymmdd + field4_time_hhmmss + field5_date_yyyymmdd ;
		sapLine = sapLine + field6_time_hhmmss + field7_rec_type + field8_clock_number + field9_4spaces;
		
		return sapLine;
		
	}

}
