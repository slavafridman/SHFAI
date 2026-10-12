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
public class CtiUnitCreditBean extends ShfBaseBean{

	protected static HashMap fieldsMapping = null;
	static {
		
		fieldsMapping = new HashMap();
		

		fieldsMapping.put("CREDIT_CODE","credit_code");
		fieldsMapping.put("UNIT_CODE","unit_code");
		fieldsMapping.put("CREDIT_VLAUE","credit_vlaue");
		fieldsMapping.put("UPDATE_DATE","update_date");
		fieldsMapping.put("UPDATE_ID","update_id");
				
	}
	
	public long credit_code;
	public String unit_code;
	public Integer credit_vlaue;
	public Date update_date;
	public String update_id;
	
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}
	
	/**
	 * @return
	 */
	public long getCredit_code() {
		return credit_code;
	}

	/**
	 * @return
	 */
	public Integer getCredit_vlaue() {
		return credit_vlaue;
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
	 * @param l
	 */
	public void setCredit_code(long l) {
		credit_code = l;
	}

	/**
	 * @param l
	 */
	public void setCredit_vlaue(Integer l) {
		credit_vlaue = l;
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

}
