package bzq.shf.taglib;

import java.util.Vector;

import bzq.forms.TableInfo;
import bzq.shf.bean.InnerJobBean;
import bzq.shf.profile.UserProfile;
import bzq.taglib.SelectTag;
import bzq.utils.BaseConvert;

public class InnerJobSelectTag extends SelectTag{
	
	
	protected void drawOption (StringBuffer buffer, TableInfo option, String selectedValue){
		UserProfile userProfile = (UserProfile) pageContext.getSession().getAttribute("userProfile");
		Vector allowedUnits = userProfile.getAllowedUnits();
		InnerJobBean activity=(InnerJobBean)option;
		if("00".equals(activity.getCode()) || (activity.getOrgUnit()!=null && allowedUnits.contains(activity.getOrgUnit()))){
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
