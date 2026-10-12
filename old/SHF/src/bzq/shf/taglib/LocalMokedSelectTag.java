/*
 * Created on 09/02/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.taglib;

import bzq.forms.TableInfo;
import bzq.shf.forms.ActivityForm;
import bzq.taglib.SelectTag;
import bzq.utils.BaseConvert;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class LocalMokedSelectTag extends SelectTag{
	
	private String moked;
	
	protected void drawOption (StringBuffer buffer, TableInfo option, String selectedValue){
		ActivityForm activity=(ActivityForm)option;
		String mokedString=activity.getMoked();
		if("00".equals(activity.getCode()) || (mokedString!=null && mokedString.equals(moked))){
			
			String optionValue = null;
			String optionCode=option.getCode();
			if (optionCode!=null)
				optionValue = optionCode.trim();
	
	
			if (activity.getVirtualActivity()==null){ // select only without virtual (we want only local activities)
				buffer.append("<option value=\"");
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
	public String getMoked() {
		return moked;
	}

	/**
	 * @param string
	 */
	public void setMoked(String string) {
		moked = string;
	}

}
