package bzq.shf.taglib;

import java.util.Vector;

import javax.servlet.jsp.JspException;

import org.apache.struts.util.RequestUtils;
import org.apache.struts.util.ResponseUtils;

import bzq.shf.forms.MobileAuditRefForm;
import bzq.shf.utils.TablesConstants;
import bzq.taglib.BaseHandlerTag;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;

public class MobileActionSelectTag extends BaseHandlerTag {
	private String name;
	private String formName;
	private String formProperty;
	
	public int doStartTag() throws JspException {
		
		AppResources appRes = AppResources.getInstance();
		TablesContainer tc = appRes.getTablesContainer();
		Vector <MobileAuditRefForm>mobileAuditRef = tc.getTable(TablesConstants.MOBILE_AUDIT_REF);
		
		String val = null;
		if(formName != null && formProperty != null){
			Object obj = RequestUtils.lookup(pageContext, formName, formProperty, null);
			if(obj instanceof String) {
				val = (String)obj;
			}
		}
		ResponseUtils.write(pageContext,"<select");
		if(getOnchange() != null){
			ResponseUtils.write(pageContext," onchange="+getOnchange());
		}
		if(name != null && name != ""){
			ResponseUtils.write(pageContext," name="+name);
		}
		ResponseUtils.write(pageContext,">");
		ResponseUtils.write(pageContext,"<option value=00"+("00".equals(val) == true ? " selected=selected" : "") +">הכל</option>");
		for (MobileAuditRefForm ref : mobileAuditRef) {
			ResponseUtils.write(pageContext,"<option value="+ref.getCode());
			if( val != null && val != "00" && ref.getCode().equals(val)) {
				ResponseUtils.write(pageContext," selected=selected");
			}
			ResponseUtils.write(pageContext," >");
			ResponseUtils.write(pageContext,ref.getDescription());
			ResponseUtils.write(pageContext,"</option>");
		}		

		ResponseUtils.write(pageContext,"</select>");
		return (SKIP_BODY);
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getFormName() {
		return formName;
	}

	public void setFormName(String formName) {
		this.formName = formName;
	}

	public String getFormProperty() {
		return formProperty;
	}

	public void setFormProperty(String formProperty) {
		this.formProperty = formProperty;
	}
	
}
