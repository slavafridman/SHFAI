/*
 * Created on 20/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import java.util.Date;
import java.util.HashMap;


/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class SystemParameterForm extends TableForm {
	
	
	static {
		fieldsMapping.put("PARAM_VALUE", "paramValue");
		fieldsMapping.put("UNIT_CODE", "unitCode");
		fieldsMapping.put("DEFAULT_VALUE", "paramDefault");
		fieldsMapping.put("MODUSER", "modificationUser");
		fieldsMapping.put("MODTIME", "modificationTime");
	}
	
	private String paramValue;
	private String unitCode;
	private String paramDefault;
	private String modificationUser;
	private Date modificationTime;
	

	/**
	 * @return
	 */
	public Date getModificationTime() {
		return modificationTime;
	}

	/**
	 * @return
	 */
	public String getModificationUser() {
		return modificationUser;
	}

	/**
	 * @return
	 */
	public String getParamDefault() {
		return paramDefault;
	}

	

	

	/**
	 * @return
	 */
	public String getParamValue() {
		return paramValue;
	}

	/**
	 * @return
	 */
	public String getUnitCode() {
		return unitCode;
	}

	/**
	 * @param date
	 */
	public void setModificationTime(Date date) {
		modificationTime = date;
	}

	/**
	 * @param string
	 */
	public void setModificationUser(String string) {
		modificationUser = string;
	}

	/**
	 * @param string
	 */
	public void setParamDefault(String string) {
		paramDefault = string;
	}

	
	/**
	 * @param string
	 */
	public void setParamValue(String string) {
		paramValue = string;
	}

	/**
	 * @param string
	 */
	public void setUnitCode(String string) {
		unitCode = string;
	}

	/**
	 * @return
	 */
	public SystemParameterForm copyParam() {
		SystemParameterForm p=new SystemParameterForm();
		p.setCode(getCode());
		p.setDescription(getDescription());
		p.setParamDefault(getParamDefault());
		p.setParamValue(getParamValue());
		p.setUnitCode(getUnitCode());
		p.setModificationTime(getModificationTime());
		p.setModificationUser(getModificationUser());
		return p;
	}
	
	public String getValue(){
		if(getParamValue()==null)
			return getParamDefault();
		return getParamValue(); 
	}

}
