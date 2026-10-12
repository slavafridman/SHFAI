/*
 * Created on 24/11/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.bean;

import java.util.Date;
import java.util.HashMap;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class EmployeeSkillBean extends ShfBaseBean{

	protected String skillId;
	protected Date skillDate;
	protected int skillOn;
	protected int skillLevel; 
	
	protected static HashMap fieldsMapping = null;
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("SKILL_ID", "skillId");
		fieldsMapping.put("SKILL_LEVEL","skillLevel");
		fieldsMapping.put("SKILL_ON","skillOn");
		fieldsMapping.put("SKILL_DATE","skillDate");
	}
	
	/* (non-Javadoc)
	 * @see bzq.shf.bean.ShfBaseBean#getFieldsMapping()
	 */
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}

	
	/**
	 * @return
	 */
	public Date getSkillDate() {
		return skillDate;
	}

	/**
	 * @return
	 */
	public String getSkillId() {
		return skillId;
	}

	/**
	 * @return
	 */
	public int getSkillLevel() {
		return skillLevel;
	}

	/**
	 * @return
	 */
	public int getSkillOn() {
		return skillOn;
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
	public void setSkillDate(Date date) {
		skillDate = date;
	}

	/**
	 * @param string
	 */
	public void setSkillId(String string) {
		skillId = string;
	}

	/**
	 * @param i
	 */
	public void setSkillLevel(int i) {
		skillLevel = i;
	}

	/**
	 * @param i
	 */
	public void setSkillOn(int i) {
		skillOn = i;
	}

}
