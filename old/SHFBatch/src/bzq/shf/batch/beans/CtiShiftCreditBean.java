/*
 * Created on 02/12/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.batch.beans;

import java.util.Date;
import java.util.HashMap;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class CtiShiftCreditBean extends CtiShiftBean{

	static {
		fieldsMapping.put("CTI_SHIFT_ID","cti_shift_id");
		fieldsMapping.put("CREDIT_CODE","credit_code");
		fieldsMapping.put("UNIT_CODE","unit_code");
		fieldsMapping.put("UPDATE_DATE","update_date");	
		fieldsMapping.put("UPDATE_ID","update_id");
		
		//from attendance table
		fieldsMapping.put("BRIEF","brief"); // has to add that into attandance
				
	}
	
	public long cti_shift_id;
	public int credit_code;
	public String unit_code;
	public Date cti_shift_start_reward;
	public Date update_date;
	public String update_id;
//	from attendance table
	public int brief;
	
	

	/**
	 * @return
	 */
	public int getCredit_code() {
		return credit_code;
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
	public Date getCti_shift_start_reward() {
		return cti_shift_start_reward;
	}


	/**
	 * @return
	 */
	public String getUnit_code() {
		return unit_code;
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
	 * @param i
	 */
	public void setCredit_code(int i) {
		credit_code = i;
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
	public void setCti_shift_start_reward(Date date) {
		cti_shift_start_reward = date;
	}

	/**
	 * @param string
	 */
	public void setUnit_code(String string) {
		unit_code = string;
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
public int getBrief() {
	return brief;
}

/**
 * @param i
 */
public void setBrief(int i) {
	brief = i;
}

}
