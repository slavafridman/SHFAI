/*
 * Created on 20/11/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.taglib;

import java.util.Vector;

import bzq.forms.TableInfo;
import bzq.shf.forms.OrgUnitTableForm;
import bzq.shf.profile.UserProfile;
import bzq.taglib.SelectTag;
import bzq.utils.BaseConvert;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class UnitSelectTag extends SelectTag{
	
	protected String type;
	protected String parentunit;
	
	public UnitSelectTag(){
		super();
	}	
		
	protected void drawOption (StringBuffer buffer, TableInfo option, String selectedValue){
		UserProfile userProfile = (UserProfile) pageContext.getSession().getAttribute("userProfile");
		Vector allowedUnits = userProfile.getAllowedUnits();
		
		OrgUnitTableForm unitTable=(OrgUnitTableForm)option;
		if(unitTable!=null && unitTable.getType()!=null)
		if(unitTable.getType().equals("-1") || allowedUnits.contains(unitTable.getCode()))
		if(unitTable.getType().equals("-1") ||unitTable.getType().equals(type) ){
			if(parentunit==null || parentunit.equals("-1") || unitTable.getType().equals("-1") || unitTable.getParent().equals(parentunit)){
				buffer.append("<option value=\"");
				String optionValue = null;
				if (option.getCode()!=null)
					optionValue = option.getCode().trim();
				
				buffer.append(optionValue);
				buffer.append("\"");
				
				if ((selectedvalue != null)&& (optionValue != null))
					if (selectedvalue.equals(optionValue))
						buffer.append(" selected ");
				buffer.append(">");
				buffer.append(BaseConvert.specialCharactersHTML(option.getDescription().trim(), false, false));
				buffer.append("</option>");
				buffer.append("\n");
			}
		}
	}
	
	

	/**
	 * @return
	 */
	public String getType() {
		return type;
	}

	/**
	 * @param i
	 */
	public void setType(String i) {
		type = i;
	}

	/**
	 * @return
	 */
	public String getParentunit() {
		return parentunit;
	}

	/**
	 * @param i
	 */
	public void setParentunit(String i) {
		parentunit = i;
	}

}
