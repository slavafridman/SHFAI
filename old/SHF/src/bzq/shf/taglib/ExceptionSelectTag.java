/*
 * Created on 09/02/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.taglib;

import bzq.forms.TableInfo;
import bzq.shf.bean.ExceptionActivityBean;
import bzq.taglib.SelectTag;
import bzq.utils.BaseConvert;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ExceptionSelectTag extends SelectTag{
	
	private String site;
	
	protected void drawOption (StringBuffer buffer, TableInfo option, String selectedValue){
		ExceptionActivityBean excp =(ExceptionActivityBean)option;
		
		if(excp.getCode().equals("00") || (excp.getSiteId()!=null && excp.getSiteId().equals(site))){
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
		
	
	/**
	 * @return
	 */
	public String getSite() {
		return site;
	}

	/**
	 * @param string
	 */
	public void setSite(String string) {
		site = string;
	}

}
