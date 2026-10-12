/*
 * Created on 08/02/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.taglib;

import bzq.forms.TableInfo;
import bzq.shf.forms.EventReasonForm;
import bzq.taglib.SelectTag;
import bzq.utils.BaseConvert;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class EventReasonTag extends SelectTag{
	
	protected int type;
	
	public EventReasonTag(){
		super();
	}
	
	protected void drawOption (StringBuffer buffer, TableInfo option, String selectedValue){
		EventReasonForm eventTable=(EventReasonForm)option;
		
		if(eventTable.getType()==type || ("yes".equals(emptySelection) && "00".equals(eventTable.getCode())) ){
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
	public int getType() {
		return type;
	}

	/**
	 * @param i
	 */
	public void setType(int i) {
		type = i;
	}

}
