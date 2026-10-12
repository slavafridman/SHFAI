/*
 * Created on 25/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.transfer;

import java.util.HashMap;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class SkillForm extends BaseAdminForm{
	
	protected static HashMap fieldsMapping = null;
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("SKILL_ID", "skillId");
		fieldsMapping.put("SKILL_NAME", "skillName");
		fieldsMapping.put("SKILL_DESC", "skillDesc");
		fieldsMapping.put("IS_LANGUAGE", "isLanguage");
	}
	
	private int skillId;
	private String skillName;
	private String skillDesc;
	private int isLanguage;
	/**
	 * @return
	 */
	public String getSkillDesc() {
		return skillDesc;
	}

	/**
	 * @return
	 */
	public int getSkillId() {
		return skillId;
	}

	/**
	 * @return
	 */
	public String getSkillName() {
		return skillName;
	}

	/**
	 * @param string
	 */
	public void setSkillDesc(String string) {
		skillDesc = string;
	}

	/**
	 * @param i
	 */
	public void setSkillId(int i) {
		skillId = i;
	}

	/**
	 * @param string
	 */
	public void setSkillName(String string) {
		skillName = string;
	}


	public HashMap getFieldsMapping() {	
		return fieldsMapping;
	}

	/**
	 * @param map
	 */
	public static void setFieldsMapping(HashMap map) {
		fieldsMapping = map;
	}

	/**
	 * @return
	 */
	public int getIsLanguage() {
		return isLanguage;
	}

	/**
	 * @param i
	 */
	public void setIsLanguage(int i) {
		isLanguage = i;
	}

}
